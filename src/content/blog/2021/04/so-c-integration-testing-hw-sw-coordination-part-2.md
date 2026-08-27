---
title: 'SoC Integration Testing: Hw/Sw Coordination (Part 2)'
date: '2021-04-18T09:01:00.000-07:00'
tags:
- SoC Verification
- PyBFMs
- Software-Driven Verification
- Bus Functional Models
- Python
legacy: true
author: Matthew Ballance
blogger_id: tag:blogger.com,1999:blog-142675602739945566.post-8108144240203267066
blogger_orig_url: https://bitsbytesgates.blogspot.com/2021/04/soc-integration-testing-hwsw.html
modified_time: '2021-04-18T09:01:23.981-07:00'
image: https://1.bp.blogspot.com/-ZBoJb1TpY0c/YHs7BEuD-CI/AAAAAAAADpQ/-6mLIuhpgRA-EWwhuCzgZf8AZAwIXyQagCLcBGAsYHQ/s72-c/splash.png
series: SoC Integration Testing
syndicate: none
---

<div>

[![](/legacy-img/splash-10.png)](/legacy-img/splash-10.png)

</div>

  

<div>

Controlling the outside world -- specifically interface BFMs -- from embedded software is critical to SoC integration tests that exercise interface IP. [In the last post](/blog/so-c-integration-testing-hw-sw-test-coordination-part-1/), we showed how to pass data from embedded software to Python by tracing execution of the processor core and reading the mirrored values of registers and memory to obtain parameter values. While functional, doing things in this way is highly specific to one message-passing approach and is pretty labor intensive. In this post, we'll add some abstraction and automation to improve usability and scalability.

</div>

<div>

**Design Goals**

</div>

<div>

**  
**

</div>

<div>

<div>

[![](/legacy-img/HvlRpc_Diagram.png)](/legacy-img/HvlRpc_Diagram.png)

</div>

  
**  
**

</div>

<div>

While we're initially focused on providing a nice automated way to communicate between embedded software and the test harness in a simulation environment, the design goals go beyond this. The diagram above shows the basic architecture. *Endpoints *provide a portal for one environment to call APIs in another environment. Each *endpoint* supports a known set of APIs, and different endpoints will support different sets of APIs. 

</div>

<div>

Each environment interacts with APIs on an endpoint without needing to know how communication is implemented. For example, execution trace might be used to implement processor to Python communication in a simulation-based environment. When the design is synthesized to FPGA, communication might be implemented via an external interface. With appropriate abstraction, neither the test software running on the processor nor the Python test code should need to change despite the fact that data is being moved in very different ways. 

</div>

<div>

In order for this to be feasible, we'll need to collect some meta-data about the APIs.

</div>

<div>

**Example**

</div>

<div>

**  
**

</div>

<div>

I always find an example to be helpful, so let's look at the enhancements to the flow in the context of a simple example.

</div>

<div>

 

</div>

<div>

<div>

[![](/legacy-img/Example_Diagram.png)](/legacy-img/Example_Diagram.png)

</div>

  
The diagram above shows the key elements of a very small SoC called [Tiny SoC](https://github.com/mballance/tiny-soc). We can test many aspects of integration using just software on the processor. For example, we can read registers in the peripheral devices and check that they are correct. We can carry out DMA transfers. But, we need to control the outside world when testing the full path from software through the UART and SPI devices.

</div>

<div>

Bus functional models (BFMs) or Verification IP (VIP) provide very effective ways to interact with interface protocols from testbench code. What we need in addition is a way to control these BFMs from the software running on the core in the design.

</div>

<div>

**  
**

</div>

<div>

**  
**

</div>

<div>

**Capturing the API**

</div>

<div>

Let's focus on the UART for now. Our [UART BFM](https://github.com/pybfms/pybfms-uart) provides a detailed API for configuring individual attributes of the UART protocol (eg baud-rate divisor) and for interacting with the UART protocol a [byte at a time](https://github.com/pybfms/pybfms-uart/blob/9a8ae924a8a599239e5efdde42f2b66f6d4d2440/src/uart_bfms/uart_bfm.py#L31-L52). That's fine for IP-level testing, but is a bit too low-level for software-driven testing.

</div>

<div>

For software-driven testing, we want to instruct the BFM to do some reasonable amount of work and let it go. To help with this, the UART BFM defines a [higher-level API](https://github.com/pybfms/pybfms-uart/blob/master/src/uart_bfms/uart_bfm_sw_api.py) intended for use by software. 

</div>

<div>

[![](/legacy-img/HigherLevel_Tx.png)](/legacy-img/HigherLevel_Tx.png)

</div>

  

<div>

An example of that higher-level API is shown above. Calling the *uart_bfm_tx_bytes_incr* API causes the BFM to begin sending a stream of bytes starting with a specific value and incrementing. There is another API that instructs the BFM to expect to receive a stream of bytes sent by the software running on the processor.

</div>

<div>

To enable automation, we describe the Python API that we will call from embedded software using special annotations. We collect related APIs together in a class, and identify whether these methods are *exported* by the Python environment and will be called by the embedded software, or are *imported* by the Python and will be called by Python code. 

</div>

<div>

[![](/legacy-img/ApiClass.png)](/legacy-img/ApiClass.png)

</div>

  

<div>

Since we want embedded software to call this API, the API is considered to be *exported* by Python. You can also see the configuration function that updates the UART's configuration (eg baud rate).

</div>

<div>

Each of the method parameters is given a Python3 type annotation. This enables the Python libraries to know the type of each parameter and collect the right data to pass when the functions are called. 

</div>

<div>

On the C side, we simply need to have functions with the same signature as what we've captured in the Python API definition.

</div>

<div>

[![](/legacy-img/C_API.png)](/legacy-img/C_API.png)

</div>

While the code shown above ([link](https://github.com/pybfms/pybfms-uart/blob/master/src/uart_bfms/share/sw/c/uart_bfm.c)) is hand-coded, we could generate it automatically based on what is specified in the Python API definition.   

<div>

**Connecting to Implementation: Python**

</div>

<div>

**  
**

</div>

<div>

Connecting all of this up on the Python side involves connecting the relevant BFMs and API implementations together. 

</div>

<div>

[![](/legacy-img/Connect_Python.png)](/legacy-img/Connect_Python.png)

</div>

The snippet above is from the cocotb test that runs when a baremetal software test is run ([link](https://github.com/mballance/tiny-soc/blob/main/verilog/common/python/tiny_soc_tests/baremetal.py)). At the beginning of simulation, the test locates the relevant BFMs. The *u_dbg_bfm* is the tracer BFM that monitors execution of software on the processor core. This BFM implements an *Endpoint*, as shown in the diagram at the beginning of the post. The *u_uart_bfm* is the BFM connected to the UART interface on TinySoC. 

<div>

Once we have all the BFMs, we can create an instance of the higher-level UART BFM API (*uart_bfm_sw*) and tell the debug BFM that it should handle the embedded software calling these APIs.  

<div>

**Example C-Test**

</div>

<div>

With the BFMs connected on the Python side, we can now focus on how to interact with the BFM from the software test.

</div>

<div>

<div>

[![](/legacy-img/RxTest.png)](/legacy-img/RxTest.png)

</div>

The software test snippet above transmits some data via the UART to the waiting UART BFM to check ([link](https://github.com/pybfms/pybfms-uart/blob/master/src/uart_bfms/share/sw/c/uart_bfm.c)). Before we can send data, both the UART IP and the external BFM need to be configured in the same way. We program the UART IP via its registers, and call the *uart_bfm_config* function to cause the corresponding Python method to be invoked. This will cause the UART BFM mode to be configured.

</div>

<div>

Next, we call the *uart_bfm_rx_bytes_incr* to tell the UART BFM that it should expect to receive 20 bytes. It should expect the first byte to have a value 10 and subsequent bytes to increment by one. By telling the BFM what to expect, our test is self-checking and the required amount of interaction is small.

</div>

<div>

Finally, we again interact with the UART IP actually send the data that the BFM is expecting.   

</div>

<div>

**Next Steps**

</div>

<div>

The API definition and Endpoint architecture described in the post above provides a modular way to capture the APIs used to communicate across environments. Because the API signature is captured in machine-readable way, it also enables the use of automation when implementing the APIs for different environments. 

</div>

<div>

As I mentioned at the beginning of the post, the API and Endpoint architecture is designed so it can be applied in many verification environments -- it's certainly not restricted to just communicating between embedded software test and the test harness. I've been interested for a while in methodology for creating and verifying firmware along with the IP that it controls such that it's ready to go when SoC-integration testing begins. My next post will begin exploring how to create, verify, and deliver firmware along with an IP.

</div>

<div>

***References***

</div>

- pybfms-uart -- <https://github.com/pybfms/pybfms-uart>
- hvl-rpc -- <https://github.com/fvutils/pyhvl-rpc>
- tiny-soc -- <https://github.com/mballance/tiny-soc>

  

<div>

***Disclaimer***

</div>

<div>

<div>

*The views and opinions expressed above are solely those of the author and do not represent those of my employer or any other party.*

</div>

</div>

<div>

*  
*

</div>

</div>
