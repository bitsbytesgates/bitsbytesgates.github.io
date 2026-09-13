---
layout: post
title: Getting Started with Executable Specs
date: 2026-02-01
categories: Zuspec
excerpt_separator: <!--more-->
mermaid: true
---

Hardware engineers spend their lives working with specifications, both
natual language ("paper") and executable. We've been looking at 
characterizing the interfaces and internal implementation of executable
specifications -- models. But, enough theory. Let's look at specifications
and specification refinement through an example. Throughout the process,
we can see how the [Zuspec](https://github.com/zuspec/) ecosystem helps to 
speed and simplify the modeling process, as well as increasing our ability 
to reuse models. 

<!--more-->

# Example Vehicle: DMA Engine

A DMA engine is one of my favorite examples to use. It's relatively simple,
yet highlights several key aspects of a range of hardware devices:
- It is controlled via a software interface (mmio)
- It has characteristics of other bulk data movers, such as accelerators and high-speed communications interfaces
- Its operation often involves arbitration and resource contention

<img>

Let's walk through the process of developing a series of executable and
natural-language specifications that will allow us to refine a high-level
natural-language specification for a DMA device to a synthesizable
executable specification. I'll store all of the models in the
[zuspec-example-dma](https://github.com/zuspec/zuspec-example-dma/) 
repo so you can follow along if you're interested.


# DMA High-Level Specification

Let's start with a simple natural-language spec for what we want. You can find 
the file here: [01_highlevel_spec.md](https://github.com/zuspec/zuspec-example-dma/blob/main/docs/spec/01_highlevel_spec.md)

```
# DMA: High-Level Requirements

The DMA engine supports fast memory transfer between two 
memory regions. It is intended for use with both storage
and memory-mapped I/O devices.

## Transfer Requirements: General
- Each transfer shall have an associated priority (0..15)
- Each transfer shall have non-overlapping source and destination addresses
- Each transfer shall specifies the total number of bytes to transfer

## Transfer Requirements: Device
In addition to the requirements above:
- Each transfer shall specify an access size (eg 1, 2, 4, 8)
- Each transfer shall specify a chunk size, denominated in <accesses>
- The total transfer size is in bytes, and must be a multiple of <access-size>
- The source and destination addresses shall be aligned to <access-size>
- Each transfer specifies whether the source/dest addresses are incremented
- Device I/O is generally controlled by requests from the device itself
  - Request a chunk -> DMA engine performs <chunk-size> <access-size> accesses

## Transfer Requirements: Chaining
- It shall be possible to specify lists of both general and device transfers
```

So, these are quite high-level. They focus on the required functionality, while
spending little time on how we might implement this.

Already, though, we might want to do some experiments with different executable
specifications that implement the natural language one above.

# DMA Algorithmic Model

Our first step is to define an algorithmic model with interfaces that satisfy
the requirements above. Let's start with the Logical Interface, since that is 
often how we phrase high-level requirements.

{% highlight python %}
import zuspec.dataclasses as zdc
from typing import List, Protocol

@zdc.dataclass
class MemCpy(zdc.Struct):
    src: zdc.uptr = zdc.field()
    dst: zdc.uptr = zdc.field()
    sz: zdc.u32 = zdc.field()

@zdc.dataclass
class DevCpy(MemCpy):
    acc_sz: zdc.u8 = zdc.field()
    chk_sz: zdc.u32 = zdc.field()
    inc_src: bool = zdc.field()
    inc_dst: bool = zdc.field()


class DmaOp(Protocol):

    async def memcpy(
            self,
            src: zdc.uptr,
            dst: zdc.uptr,
            sz: zdc.u32,
            pri: zdc.i32 = 0):
        ...

    async def memcpy_chain(
            self,
            xfers: List[MemCpy],
            pri: zdc.i32 = 0):
        ...

    async def devcpy(
            self,
            src: zdc.uptr,
            dst: zdc.uptr,
            sz: zdc.u32,
            acc_sz: zdc.u8,
            chk_sz: zdc.u32,
            inc_src: bool,
            inc_dst: bool,
            pri: zdc.i32 = 0):
        ...

    async def devcpy_chain(
            self,
            xfers: List[DevCpy],
            pri: zdc.i32 = 0):
        ...
{% endhighlight %}

The API definition above captures how software would interact with the
DMA engine. But, we also care about how the DMA engine accesses memory 
in the environment, and how devices in the environment request service
from the DMA engine.

{% highlight python %}
class MemoryOp(Protocol):
    """Memory interface for DMA to access system memory."""

    async def read(self, addr: zdc.u64) -> zdc.u64:
        """Read a word from memory.

        Args:
            addr: Memory address (word-aligned)

        Returns:
            Data value read
        """
        ...

    async def write(self, addr: zdc.u64, data: zdc.u64, size: zdc.i8) -> None:
        """Write a word to memory.

        Args:
            addr: Memory address (word-aligned)
            data: Data value to write
        """
        ...
{% endhighlight %}

[mem.py](https://github.com/zuspec/zuspec-example-dma/blob/main/src/org/zuspec/example/dma/mem.py) 
defines a memory-access interface that the DMA model implementation will
use to access memory in the system.

{% highlight python %}
class ReqOp(Protocol):
    async def req_transfer(self, id: zdc.i32):
        """Request a transfer"""
        ...
{% endhighlight %}

[req.py](https://github.com/zuspec/zuspec-example-dma/blob/main/src/org/zuspec/example/dma/req.py)
defines the API used by devices to request data transfers from the DMA engine.

In total, we've define the key operations used to interact with the DMA engine
in less than 100 lines of code. Now, to do something with these operations.

# Algorithmic Model Implementation
Now that we've defined our abstract interfaces, we can create an *algorithmic* 
implementation of the DMA engine. 

You can find the algorithmic implementation of the DMA engine model here:
[op_op_alg.py](https://github.com/zuspec/zuspec-example-dma/blob/main/src/org/zuspec/example/dma/impl/op_op_alg.py).

{% highlight python %}
@zdc.dataclass
class DmaOpOpAlg(DmaOp, ReqOp, zdc.Component):
    """DMA engine with no fixed channels. Uses MemoryOp for memory access
    and implements ReqOp for device transfer request control."""
    
    mem: MemoryOp = zdc.port()
{% endhighlight %}

The interface to the model is shown above. Because we've deliberately been
abstract about the device's structure -- for example, how many channels
it contains -- the model simply implements both the DmaOp and ReqOp 
interfaces. 

{% highlight python %}
    async def memcpy(
            self,
            src: zdc.uptr,
            dst: zdc.uptr,
            sz: zdc.u32,
            pri: zdc.i32 = 0):
        """Copy memory from src to dst.
        
        Performs narrow accesses until 8-byte aligned, then wide accesses.
        """
        await self._mem_l.acquire()
        try:
            remaining = sz
            while remaining > 0:
                # Determine access size based on alignment and remaining bytes
                # Use the largest power-of-2 size that is both aligned and fits
                align = src & 0x7  # Low 3 bits give alignment
                if align == 0 and remaining >= 8:
                    xfer_sz = 8
                elif (align & 0x3) == 0 and remaining >= 4:
                    xfer_sz = 4
                elif (align & 0x1) == 0 and remaining >= 2:
                    xfer_sz = 2
                else:
                    xfer_sz = 1
                
                data = await self.mem.read(src)
                await self.mem.write(dst, data, xfer_sz)
                src += xfer_sz
                dst += xfer_sz
                remaining -= xfer_sz
        finally:
            self._mem_l.release()
{% endhighlight %}

The implementation of the 'memcpy' operation is shown above. The implementation
is simple and brief, aside from a little complexity with respect to aligning 
the address. The total model implementation is ~150 lines of Python code, 
which is just about 6x the length of the original high-level spec.

# Tests and Test Fixture

Now that we have a behavioral model, we need a way to exercise it. Fortunately,
we have a couple of tools that simplify the process. [pytest](https://docs.pytest.org/en/stable/) is used as the
testing framework, and AI assistants are proving to be incredibly capable at
creating test fixtures and tests from the behavioral model that we created.

You can find the tests in [test_op_op_alg.py](https://github.com/zuspec/zuspec-example-dma/blob/main/tests/unit/test_op_op_alg.py).
The vast majority of the code was created using an AI assistant: copilot cli and Sonnet 4.5 in this case.

{% highlight python %}
def test_memcpy_basic():
    """Test basic memcpy operation."""
    print("\n=== Test: Basic memcpy ===")

    @zdc.dataclass
    class Top(zdc.Component):
        fixture: DmaTestFixture = zdc.field()

        async def run(self):
            # Initialize source memory
            data = [0x10, 0x20, 0x30, 0x40]
            self.fixture.init_memory(0x1000, data)

            # Perform memcpy
            await self.fixture.dma.memcpy(
                src=0x1000,
                dst=0x2000,
                sz=32  # 4 words * 8 bytes
            )

            # Verify destination
            result = self.fixture.read_memory(0x2000, 4)
            assert result == data, f"Data mismatch: {result} != {data}"

            print("  Basic memcpy test PASSED")

    t = Top()
    asyncio.run(t.run())
    t.shutdown()
{% endhighlight %}

A basic transfer test is shown above, showing how the 'memcpy' operation is 
used, and how results are checked.

# Conclusions and Next Steps
Engineers spend significant time working with natural-language and executable
specifications. Zuspec simplifies the process of creating and testing 
executable specifications (models) at multiple abstraction levels, which
enables greater use of executable models to help refine our natural-language
specifications.

Algorithmic modeling of this style is done today -- and, often, in Python. 
The difference with Zuspec is that the models are designed to be reusable
for multiple purposes. Over the next few posts, we'll look at how we continue
to refine, reuse, and retarget our DMA model.

# Resources
- [zuspec-example-dma]()
