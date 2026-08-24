---
title: Make Your Prototype Board Cloud-Accessible
date: '2017-12-12T18:49:00.000-08:00'
tags:
- RTL
- Chisel3
- FPGA
- Altera
- Prototype
- HDL
legacy: true
author: Matthew Ballance
blogger_id: tag:blogger.com,1999:blog-142675602739945566.post-3562136726369297789
blogger_orig_url: https://bitsbytesgates.blogspot.com/2017/12/make-your-prototype-board-cloud.html
modified_time: '2017-12-13T10:37:18.214-08:00'
image: https://3.bp.blogspot.com/-gVJQ9J60d7k/WigffOlHBQI/AAAAAAAACJQ/AQh-Px7v6So2DCEg4nQkg6HkIDfgHu_PwCEwYBhgL/s72-c/IntroPicture.png
syndicate: none
---

<div>

[<img src="/legacy-img/IntroPicture.png" width="640" height="336" />](https://3.bp.blogspot.com/-gVJQ9J60d7k/WigffOlHBQI/AAAAAAAACJQ/AQh-Px7v6So2DCEg4nQkg6HkIDfgHu_PwCEwYBhgL/s1600/IntroPicture.png)

</div>

<div>

</div>

  
FPGA prototype boards are an important component of the hardware development process, and the progress of synthesizing a design, uploading it to the prototype, and validating its behavior has definitely become easier over time. Modern development environments from the major FPGA vendors make it easy to upload FPGA bitstreams to the board via a JTAG connection or via a USB JTAG adapter (often directly on the prototype board). Standard prototype boards also provide standard interface connectors that enable interaction with the hardware being validated.  
  
**So, what's the problem?**  
Despite how easy it is to connect to modern FPGA prototype boards, it is necessary to be close to and connected to them. Working on an FPGA prototype from the local coffee shop really just isn't a good option.  
  
**FPGAMgr**  
The goal of the FPGAMgr project (<https://github.com/mballance/fpgamgr>) is to change this. FPGAMgr enables access to an FPGA prototype board via the network -- be that the local network or the internet.  
  
FPGAMgr was developed using the CycloneV-based SocKit prototype board (<https://rocketboards.org/foswiki/Documentation/ArrowSoCKitEvaluationBoard>), but I'm not aware of any obstacle to making it work with a different vendor's FPGA or different prototype board. FPGAMgr currently provides two key services for interacting with a FPGA prototype board:  
  

- Programming the FPGA
- Sending data to and receiving data from I/O interfaces on the FPGA. 

  
  
**FPGAMgr Components**  
There are three components to FPGAMgr: The client, the server, and the board configuration.  
  

<div>

[<img src="/legacy-img/FPGAMgrArchitecture.png" width="148" height="200" />](https://4.bp.blogspot.com/-5oDDHLLelZo/WjCNMPI1G6I/AAAAAAAACKM/yoTQycKP00ETXqe0IgD-9jdK2cBDD4QnwCLcBGAs/s1600/FPGAMgrArchitecture.png)

</div>

  
The client is an API that provides functions for uploading a bitstream to the FPGA, as well as methods to exchange data with I/O interfaces on the FPGA. The server is device and environment agnostic code that processes messages. The board config consists of device- and environment-aware code that knows how to program the FPGA device and knows which I/O interfaces are available to FPGAMgr and how to interact with those interfaces.  
  
**FPGAMgr with SocKit**  
The CycloneV device was Altera's (now Intel's) first foray into pairing an ARM processor with an FPGA fabric. The Arrow SoCKit board (show below) provides an array of physical I/O interfaces connected to the CycloneV.  

<div>

[<img src="/legacy-img/C5S_2013_image_top_01.jpg" width="320" height="248" />](https://1.bp.blogspot.com/-cakrziM0SSM/WjCOuF6SyhI/AAAAAAAACKY/BVLITEEjHd4Ef51Bj2ybzENNgQAu3lWDwCLcBGAs/s1600/C5S_2013_image_top_01.jpg)

</div>

Since I'm not doing anything too involved with the ARM processor subsystem within the CycloneV, I'll actually run FPGAMgr on the ARM processor. FPGAMgr could also be run on a host workstation connected to the prototype board via JTAG cable and other cables for I/O.  
  
**Example**  
I developed a very simple example design to use in testing out FPGAMgr. Much less involved that what I plan to test using FPGAMgr, but hopefully it illustrates the concept. I wanted to show that I could both program the device, and prove that I'd done so, over the network from my laptop. One of the simplest ways to do so is with a UART-based design that echos back the data it receives. The design looks a bit like this:  
  

<div>

[<img src="/legacy-img/DesignPhoto.png" width="320" height="238" />](https://4.bp.blogspot.com/-QiPdd_RVjzo/WjCKTE-HhNI/AAAAAAAACJ8/k8xR-amBcvsbx6Alfq2UmWRgwEsfJdabwCLcBGAs/s1600/DesignPhoto.png)

</div>

  
The UART is a basic UART from the OpenCores site with a Wishbone bus. The Responder is a custom state machine that initializes the UART, waits for a character to be received, then transmits it back. The count register keeps track of the number of characters received.  
  
The test code that runs on the remote machine is shown (minus some argument-parsing code) below.  
  
```

``` ```
<img border="0" data-original-height="690" data-original-width="543" src="/legacy-img/TestBench.jpg" />
``` ```

``` The code:  

- Connects via the network to the FPGAMgr server
- Registers a sideband-channel interface for communicating with the UART
- Programs the FPGA with the simple design
- Sends and receives a series of messages from the UART within the design

  
**Demo**  
The short video below shows the process of connecting to, programming, and interacting with the prototype board from the host workstation.  
  

- The pane in the upper-left shows the prototype board via a camera pointed at the board.
- The pane in the lower-left is a login session running on the ARM processor on the SoCKit board.
- The right-hand pane shows the testbench C++ program running on my laptop.

  
  
The general demo process is as follows:  
  

- I launch the FPGAMgr server specific to the Altera SoCKit in the lower left-hand pane

- I run the testbench program on my laptop that:

- - Uploads the design image to the FPGA
  - Connects to the UART I/O
  - Sends a series of messages to the UART and receives them back

- You'll see the LEDs flashing on the prototype as the testbench program runs. The count displayed by the LEDs increments once for 16 characters received by the UART.

  
  

<div>

<div class="iframe">

<div id="player">

</div>

<div class="player-unavailable">

# An error occurred.

<div class="submessage">

Unable to execute JavaScript.

</div>

</div>

</div>

</div>

<div>

**Conclusion**

</div>

<div>

FPGAMgr makes it easy to access a prototype board across the network, enabling programming the FPGA and virtualized access to design I/O interfaces. What's present at the moment is proof of concept support for Altera/Intel devices and simple I/O interfaces. 

</div>

<div>

Do you virtualize access to your FPGA prototype? What are your approaches and key requirements?

</div>
