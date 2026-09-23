---
title: 'PSS 3.1: Target Runtime'
date: 2026-09-22
series: PSS in the Open
categories: [PSS, Open Source EDAs]
syndicate: derived
---

The two ways a PSS description connects to a platform have very different
tradeoffs. Target-code generation -- last post's subject -- gives you 
fine-grained control over the syntax of the code that implements a test; 
it treats PSS as a
language for generating test code. The cost is that the model has to specify
everything the generated text contains, and means the tool can't do much with
the model beyond expanding it.

The procedural interface trades that control away and gets something back. When
the model is written against an API instead of against a body of text, the tool
knows what is being called and with what values, and it gets to choose how to
make that happen -- emit a C file, walk the scenario in a runtime linked into
the test, drive it from the host. That's the target runtime, and it's where PSS
3.1 does some of its most interesting work: once something of PSS is present
*while the test runs*, the standard can start defining behavior that happens
during the test rather than behavior decided before it started.

<!--more-->

# What it is

There are really three ways a PSS model can reach the platform, and it's worth
being precise about where they differ, because two of them look identical in
the model and differ entirely in what shows up on the target.

<p align="center">
<img src="/imgs/2026/09/pss31_runtime_modes.png" width="720" alt="Three rows, all of which end up calling dma_start(64) on the target. Row 1, literal code: an action with an 'exec body C' template containing dma_start({{sz}}) produces dma_test.c containing dma_start(64) -- the model wrote the call, and the tool copied text without ever seeing a function. Row 2, generated calls: an action that imports a target function dma_start and calls it from a native exec body produces the same dma_test.c, but this time the tool wrote the call. Both compile to a test that runs with no PSS at run time. A dashed divider labelled 'the target runtime starts here' separates these from row 3, runtime calls: the same model as row 2, but nothing is compiled -- the scenario stays inside the tool's target runtime, which walks the activity, calls dma_start(64) itself, and can be called back into."/>
</p>

All three end up calling `dma_start(64)`. The diagram is deliberately arranged
so that the *outcome* is constant and only the path to it changes.

1. **Literal code.** The model carries a snippet of target-language text and
   the tool expands it. The call in the generated file is there because the
   model author typed it into a string; the tool has no idea what the snippet
   means and never sees a function at all. This is last post's subject.
2. **Generated calls.** The model declares the environment's API with `import
   target function` and calls it from a native PSS `exec body`. The tool still
   emits the same text file -- but now *it* wrote the call, because it knows
   the signature and it knows the argument values.
3. **Runtime calls.** The same model as (2), realized differently: no test text
   is generated at all. The tool's target runtime holds the scenario, walks the
   activity, and invokes the environment's API directly.

Rows 1 and 2 differ only in who knows what. Rows 2 and 3 are exactly the same
PSS description. The difference between rows 2 and 3 is entirely in how the
tool implements the output.

Rows 2 and 3 are the ones that the rest of this post depend on because, in 
both cases, the PSS tool provides a runtime library accessible via function calls.
And, that's what makes it possible to talk about behavior specified in PSS 
that happens *during* the test.

# Channels

An activity says what order actions run in. `parallel` says two actions run
concurrently; a binding says one's output is the other's input. All of that is
settled before the test starts -- it's scheduling, and scheduling is a
solve-time concern.

What an activity cannot specify is coordination between concurrently-executing
actions at runtime. Two actions running
concurrently on the target have had no way to tell each other anything while
they run. PSS 3.1 adds `sync_pkg` (21.9) for exactly this, and in this draft it
contains one type: `channel_c`.

```pss
component channel_c<type T, int DEPTH=1> {
    target function T    get();
    target function void put(T t);
    target function bool try_get(output T t);
    target function bool try_put(T t);
}
```

A FIFO of `DEPTH` elements (default 1), holding values of type `T`, with
blocking and non-blocking access at both ends. If you've written SystemC or
SystemVerilog, this likely looks familiar. What's new is *where* it lives:
the channel is a PSS component, the operations are target functions, and the
implementation is the tool's problem instead of yours.

## An example that isn't statically determinable

The usual sketch of a channel is a producer and a consumer passing data items,
which is fine but doesn't show why this needs to be in the language -- you can
schedule producers and consumers with an activity today. The case that needs a
runtime handshake is the one where the *moment* matters and nothing at solve
time knows when it arrives.

So: inject a parity error into a NoC stream, but only once that stream is
genuinely congested. Congestion is the whole point of the test -- an error
injected into an idle fabric exercises a different path entirely -- and the
occupancy threshold is reached whenever the DUT gets around to reaching it.
There's no traversal count that means "backed up."

Two actions, run in `parallel`. One drives load and watches occupancy; the
other waits, injects, and reports back.

```pss
import sync_pkg::*;

component noc_c {
    // Environment APIs available on the target platform
    import target function void   send_burst(bit[8] strm, bit[16] len);
    import target function bit[8] occupancy(bit[8] strm);
    import target function void   inject_parity_err(bit[8] strm);
    import target function bit[8] err_status(bit[8] strm);
    import target function void   expect_parity_err(bit[8] status);

    channel_c<bit[8]> congested;   // load -> injector: "backed up on this stream"
    channel_c<bit[8]> injected;    // injector -> load: "done; here is the status"

    action load_a {
        rand bit[8]             strm;
        rand bit[8] in [60..90] threshold;

        exec body {
            bit[8] status;
            bool   signaled = false;

            // Keep the traffic up until the injector reports back
            while (!comp.injected.try_get(status)) {
                send_burst(strm, 256);

                if (!signaled && occupancy(strm) >= threshold) {
                    comp.congested.put(strm);
                    signaled = true;
                }
            }

            expect_parity_err(status);
        }
    }

    action inject_a {
        exec body {
            // Blocks until the load action reports congestion, and learns
            // which stream got there from the data the channel carries
            bit[8] strm = comp.congested.get();

            inject_parity_err(strm);
            comp.injected.put(err_status(strm));
        }
    }

    action inject_under_load_a {
        activity {
            parallel {
                do load_a;
                do inject_a;
            }
        }
    }
}
```

<p align="center">
<img src="/imgs/2026/09/pss31_channel_handshake.png" width="720" alt="A sequence diagram with two lifelines, load_a on the left and inject_a on the right, time running downward. load_a runs a non-blocking loop: while try_get on the injected channel returns false, send_burst, and when occupancy crosses the threshold, put the stream id on the congested channel. inject_a calls congested.get() and sits in a highlighted 'blocked' band -- no polling, no threshold, no idea which stream it will be handed -- annotated with clause 20.8, other exec blocks on this executor keep being evaluated. When occupancy hits 74 an arrow crosses left to right carrying congested.put(3). inject_a wakes with strm == 3 as data, calls inject_parity_err(3) and puts err_status(3) back on the injected channel. That arrow crosses right to left, load_a's try_get returns true, the loop exits and it calls expect_parity_err(status)."/>
</p>

Three things in there are worth pulling out.

**The blocking end is the easy end.** `inject_a` consists of one `get()` and
the work that follows it. It doesn't poll, doesn't know what the threshold is,
and doesn't know which stream it's injecting into until the channel tells it --
`strm` arrives as data, not as a solved attribute. Meanwhile `load_a`, which
must keep driving traffic or the backpressure it just built up drains away,
uses `try_get` and folds the check into the loop it was already running. Same
channel type, two different needs.

**A blocking `get()` doesn't wedge the executor.** This is the part that would
be genuinely awkward to arrange yourself on bare metal. 20.8 requires that when
target exec code blocks on a channel operation, other exec blocks assigned to
the same executor keep being evaluated -- so `inject_a` can sit in `get()` on
the same core that's running `load_a`'s traffic loop. (The converse obligation
is on you: a busy-wait loop that never blocks and never calls `yield` really
will starve everything else on that executor.)

**Two channels, not one.** Each one is unidirectional and each carries a
payload that happens to be useful -- the stream id going out, the error status
coming back. It's tempting to declare one channel and use it both ways; with
`DEPTH` 1 and two concurrent participants that's a deadlock waiting for a
scheduling change to find it.

Here are a few detailed by critical And the details that will bite eventually (21.9.1):

- Element types are limited to numeric types, Booleans, enums with a base
  type, packed structs, and arrays thereof. Data is copied in and out **by
  value**, so a channel is a message queue, not a shared object.
- All four operations are thread-safe, but the order in which multiple waiters
  are released is **non-deterministic**. If two actions are blocked in `get()`
  on the same channel, exactly one gets each element and you don't get to say
  which.
- `put` blocks when the channel is full, which for the default `DEPTH` of 1
  means the second `put` blocks until someone drains the first. `try_put`
  exists for the cases where you'd rather drop than wait.

## What's actually new here

Almost nothing in the example above is impossible today. You could write it against
your own semaphore library and your own FIFO and get the same test. The
difference is what travels with the content.

That's the portability argument for pulling a primitive in-house: a model that
uses `channel_c` is a model someone else can run. A model that uses your
`acme_sync_pkg` often is not.

It's worth noting that `sync_pkg` currently contains exactly one type. No
semaphore, no barrier, no event. `channel_c` can be pressed into service as all
three -- a `channel_c<bit>` whose payload nobody reads is an event, a
`DEPTH`-N channel pre-loaded
with tokens is a semaphore -- but "can be pressed into service as" is a
reasonable thing to have an opinion about during a public review.


# Export functions

In the channel example, both ends of the handshake were PSS. One exec block
signalled another. But the event you most often actually want to wait for isn't
produced by PSS at all -- it's an interrupt signalled by the runtime platform.

Every mechanism we've looked at so far points one direction: the model calls
out. `export function` (20.4.2) is the one that points back. It takes a native
PSS function and makes it callable from the environment, which means the
environment now has a way to put something into a channel.

<p align="center">
<img src="/imgs/2026/09/pss31_export_irq.png" width="720" alt="A sequence diagram with two lifelines: the PSS model running in the target runtime on the left, and the platform -- ordinary C -- on the right. Phase 1, run_start: the model calls irq_register(executor().get_context()), an arrow carries a chandle that names this executor to the right, and the C side stores it in irq_ctxt. Phase 2, exec body: the model calls dma_program and dma_start, an arrow goes right, and the DMA engine runs for however long it takes; the model then calls comp.completion[chan].get() and enters a highlighted 'blocked on this channel's rendezvous' band -- no polling loop, no status-register read, no yield, no spinning core. Phase 3, the interrupt: a DMA completion IRQ fires, the ordinary platform interrupt vector dma_isr calls dma_irq(irq_ctxt, chan), and a thick arrow crosses right to left into the PSS export function, a static function that calls pss_top.dma.completion[c].try_put(dma_ack_irq(c)). A curved arrow runs back up the left side labelled 'try_put releases the get()'."/>
</p>

That's the whole round trip, and the interesting constraint is in the middle of
it. An exported function is *static* -- 20.4.2 allows the qualifier only on
static functions in a component or package -- so it has no action, no
attributes, and no `comp`. Consequently, it must access required data relative
to something accessible in the global space. What it wants to access is the 
DMA's completion channels.

```pss
import sync_pkg::*;
import executor_pkg::*;

package platform_pkg {
    // Hands the environment a handle naming the executor PSS is running on
    import target function void irq_register(chandle ctxt);
}

import platform_pkg::*;

component dma_c {
    static const int NCHAN = 4;

    // Environment APIs on the target platform
    import target function void    dma_program(bit[8] chan, bit[64] src,
                                               bit[64] dst, bit[32] len);
    import target function void    dma_start(bit[8] chan);
    import target function bit[32] dma_ack_irq(bit[8] chan);  // read and clear

    // One rendezvous per hardware channel, so concurrent transfers don't
    // race for each other's completions
    channel_c<bit[32]> completion[NCHAN];


    action xfer_a {
        rand bit[8]  chan;
        rand bit[64] src;
        rand bit[64] dst;
        rand bit[32] len;

        constraint chan < NCHAN;

        exec body {
            dma_program(chan, src, dst, len);
            dma_start(chan);

            // Blocks here. No polling loop, no yield, no status register read
            // -- the handler will deliver the status when the DMA finishes.
            bit[32] status = comp.completion[chan].get();

            if (status != 0) {
                error("DMA channel %d completed with status %d", chan, status);
            }
        }
    }
}

component pss_top {
    dma_c dma;

    // Give the environment the context handle before any test code runs
    exec run_start {
        irq_register(executor().get_context());
    }
}

// What the C handler calls back into. Runs in interrupt context, so it
// uses try_put: a full channel must not become a hung handler.
static function void dma_irq(bit[8] c) {
    pss_top.dma.completion[c].try_put(dma_ack_irq(c));
}
export target function dma_irq;
```

The environment side is unremarkable, which is the point:

```c
/* Generated by the PSS tool for 'export function dma_irq'. The leading
 * context parameter is what tells the runtime which executor is calling. */
extern void dma_irq(void *ctxt, unsigned char chan);

static void *irq_ctxt;

/* Called from the PSS model's run_start exec */
void irq_register(void *ctxt)
{
    irq_ctxt = ctxt;
    plic_enable(IRQ_DMA);
}

/* Ordinary platform interrupt vector */
void dma_isr(void)
{
    dma_irq(irq_ctxt, dma_pending_chan());
}
```

Three things to observe about the example:

**The status comes back through the channel, not through the wait.** It would
be easy to build this so the exported function just signals "done" and the
action then reads the status register itself. Don't -- by then the handler has
already cleared it. `dma_ack_irq` reads and clears in interrupt context, and
the value rides the channel to whoever was waiting. The channel is carrying
data, not just a wakeup.

**The handler uses `try_put`, not `put`.** An exported function called from an
ISR is running in interrupt context on the real platform, and `put` blocks when
the channel is full. `try_put` can't. If it returns false you have a dropped
completion, which is a bug you want to find as a dropped completion rather than
as a hung interrupt handler.

**The action never spins.** Compare this against the polling loop it replaces:
a `while` loop reading a status register, with a `yield` in it so it doesn't
starve everything else on the core (20.8). That loop works, but it burns the
core it's running on and it does the thing the DUT is supposed to be doing --
it observes completion rather than being told about it. Blocking in `get()`
leaves the executor free to evaluate the other exec blocks assigned to it.

Worth knowing (20.4.2):

- Parameter and return types are restricted: `bit`/`int` up to 64 bits, `bool`,
  `enum` with a base type no wider than 64 bits, `float32`/`float64`, `string`,
  `chandle`, and structs -- but a struct parameter has to be declared `const`.
  AnnexD has the C, C++ and SystemVerilog type mappings.
- The context handle round trip -- `executor().get_context()` out in
  `run_start`, stored by the environment, passed back on every call -- is the
  pattern from Example300 and Example301. There's no ambient "current
  executor" for the environment to discover; it has to be told. Note that this
  is still needed even with a path-addressed channel: the handle is what tells
  the runtime whose context the exported function body runs in.
- The array isn't decoration. 21.9.1 makes the release order non-deterministic
  when several actions are blocked in `get()` on the same channel, so a single
  `completion` would hand channel 2's status to whoever happened to be woken.
  One channel per hardware channel means each waiter can only be released by
  its own completion.

This is the part of the target runtime that's genuinely a new capability rather
than a nicer spelling of an old one. You could always call out of a PSS model.
Calling *into* one requires that there be something there to call.


# Conclusions and providing feedback

Target-code generation in 3.1 was a list of accumulated workarounds being
retired. The target runtime is a different kind of change: `channel_c` and
`export function` let a PSS model participate in what happens while the test
runs, not just describe what should happen before it starts. A scenario can
wait for a condition nothing at solve time can predict, and the platform can
reach back into the model to tell it the condition arrived.

Here's what I'd suggest thinking about while reading Clause 20 and Clause 21.9
of the draft:

- **Find the place in your environment where you hand-rolled a
  synchronization primitive** -- a semaphore, a mailbox, a "wait for IRQ"
  helper -- and try to express it with `channel_c`. Does the single type cover
  it, or did you want the barrier and the event that `sync_pkg` doesn't have
  yet?
- **Look at how your tests wait for completion today.** If the answer is a
  polling loop over a status register, work out what it would take to replace
  it with an export function and a blocking `get()`. The interesting question
  is what the environment side costs you.
- **Check the mixed-language case.** 21.9.1(d) promises the handshake works
  across executors implemented in different languages. If you have a design
  where the C side and the SystemVerilog side both need to participate,
  that requirement is the one carrying the weight -- and it's worth saying so
  if it doesn't cover your case.

That also wraps up this tour of the PSS 3.1 public review draft. Constraints,
composition, target code, target runtime -- four posts, and the review closes at
the end of September, so there's still time. It takes a community to build a
standard, and your eyes and attention are a much-appreciated contribution!

Next time we'll change gears and start looking at open-source tooling that
helps support PSS adoption.

## References

- [Feedback Forum](https://forums.accellera.org/forum/64-portable-stimulus-31-public-review-feedback/)
- [PSS 3.1 Draft](https://www.accellera.org/images/downloads/drafts-review/PSS%203.1%20Public%20Review%20Draft%202026.08.28.pdf)
- [Post 1: PSS 3.1 Is Out for Public Review](https://bitsbytesgates.com/blog/PSS3.1_PR_01_Overview/)
- [Post 2: Simplifying Constraint Modeling](https://bitsbytesgates.com/blog/PSS3.1_PR_02_Constraints/)
- [Post 3: Simplifying Composition](https://bitsbytesgates.com/blog/PSS3.1_PR_03_Composition/)
- [Post 4: Target Code](https://bitsbytesgates.com/blog/PSS3.1_PR_04_TargetCode/)
