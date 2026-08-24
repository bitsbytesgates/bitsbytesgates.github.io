---
title: 'Chisel Sharpening: Initial impressions'
date: '2017-08-02T19:39:00.000-07:00'
tags:
- Chisel
- Chisel3
- RiscV
- HDL
legacy: true
author: Matthew Ballance
blogger_id: tag:blogger.com,1999:blog-142675602739945566.post-5090067165930278711
blogger_orig_url: https://bitsbytesgates.blogspot.com/2017/08/chisel-sharpening-initial-impressions.html
modified_time: '2017-08-02T19:39:02.820-07:00'
image: https://1.bp.blogspot.com/-wciyTu7Ffj4/WYJ0GBrRTcI/AAAAAAAAB-Y/G2fdnF-X8tUgfaxB9s5gTxAqAgwE5pQ2wCLcBGAs/s72-c/ChiselProductivity.png
syndicate: none
---

Recently, RiscV (<https://riscv.org/>) has been all the rage. The free (as in speech and beer) instruction-set architecture has experienced an explosion of interest in the last couple of years, after being more-or-less an academic curiosity since 2010 or so.  
  
This post isn't about RiscV, though. It's about Chisel (<https://github.com/freechipsproject/chisel3/wiki>) , the design language that the UC Berkeley team working on RiscV uses to implement Rocket Chip, their proof-of-concept RiscV implementation. Claims of the productivity benefits of using Chisel for hardware design are substantial. For example, one data point two implementations of a RiscV architecture -- one using Chisel and one in Verilog (<https://riscv.org/wp-content/uploads/2015/01/riscv-chisel-tutorial-bootcamp-jan2015.pdf>).  
  

<div>

[<img src="/legacy-img/ChiselProductivity.png" width="400" height="298" />](https://1.bp.blogspot.com/-wciyTu7Ffj4/WYJ0GBrRTcI/AAAAAAAAB-Y/G2fdnF-X8tUgfaxB9s5gTxAqAgwE5pQ2wCLcBGAs/s1600/ChiselProductivity.png)

</div>

<div>

3x fewer lines of code -- even (but maybe especially) if the savings was in wiring -- sounds pretty good to me! So, I decided a while ago that I should dig in and learn more about Chisel.

</div>

### So, what's Chisel?

<div>

Chisel certainly isn't a one-for-one replacement for a hardware description language (HDL) like Verilog or VHDL. Chisel is a class library, written in Scala (<https://www.scala-lang.org/>). Descriptions written using that class library are compiled, executed, and converted to Verilog. Now, your first thought when a high-level language like Scala is mentioned might be "High-Level Synthesis", but that's not what Chisel is all about. Chisel is very much focused on RTL (register-tranfer level) design.

</div>

### A learning project

<div>

I learn almost everything by doing, so I decided to assign myself a learning project to see if I could make Chisel go. A few years back, I coded a parameterized Wishbone interconnect in SystemVerilog. I was curious to see how a similar project coded in Chisel would compare.

</div>

### All about the interfaces

<div>

The first thing to do is to capture a Wishbone interface. As with many hardware interfaces, Wishbone is parameterized with address, data, and tag widths. Quite sensibly, Chisel provides a class for specifying reusable collections of signals called Bundle. Below, you can see the code used to declare the parameters for a Wishbone interface, and the Bundle (WishboneMaster) that specifies the signals for a Master interface. 

</div>

  
class WishboneParameters (  
    val ADDR_WIDTH  :  Int=32,  
    val DATA_WIDTH  :  Int=32,  
    val TGA_WIDTH   :  Int=1,  
    val TGD_WIDTH   :  Int=1,  
    val TGC_WIDTH   :  Int=1) {  
    
    def cloneType() = (new WishboneParameters(ADDR_WIDTH, DATA_WIDTH,  
        TGA_WIDTH, TGD_WIDTH, TGC_WIDTH)).asInstanceOf\[this.type\]  
}  
  
class WishboneMaster(val p : WishboneParameters) extends Bundle {  
val ADR = Output(UInt(p.ADDR_WIDTH.W));  
val TGA = Output(UInt(p.TGA_WIDTH.W));  
val CTI = Output(UInt(3.W));  
val BTE = Output(UInt(2.W));  
val DAT_W = Output(UInt(p.DATA_WIDTH.W));  
val TGD_W = Output(UInt(p.TGD_WIDTH.W));  
val DAT_R = Input(UInt(p.DATA_WIDTH.W));  
val TGD_R = Input(UInt(p.TGD_WIDTH.W));  
val CYC = Output(Bool());  
val TGC = Output(UInt(p.TGC_WIDTH.W));  
val ERR = Input(Bool());  
val SEL = Output(UInt(p.DATA_WIDTH/8));  
val STB = Output(Bool());  
val ACK = Input(Bool());  
val WE = Output(Bool());  
  
    // ...  
}  
  

### Coding up the interconnect

<div>

As with many learning projects, the Wishbone interconnect involved a series of iterations. Eventually, I arrived at the code below, broken up a bit to support comments:

</div>

<div>

<div>

class WishboneInterconnectParameters(

</div>

<div>

    val N_MASTERS  : Int=1,

</div>

<div>

    val N_SLAVES   : Int=1,

</div>

<div>

    val wb_p       : WishboneParameters) {

</div>

<div>

}

</div>

<div>

  

</div>

<div>

class WishboneInterconnect(

</div>

<div>

    val p : WishboneInterconnectParameters,

</div>

<div>

    val typename : String = "WishboneInterconnect") extends Module {

</div>

<div>

  

</div>

<div>

    val io = IO(new Bundle {

</div>

<div>

      val addr_base  = Input(Vec(p.N_SLAVES, UInt(p.wb_p.ADDR_WIDTH.W)))

</div>

<div>

      val addr_limit = Input(Vec(p.N_SLAVES, UInt(p.wb_p.ADDR_WIDTH.W)))

</div>

<div>

   

</div>

<div>

      val m = Vec(p.N_MASTERS, Flipped(new WishboneMaster(p.wb_p)))

</div>

<div>

      val s = Vec(p.N_SLAVES, new WishboneMaster(p.wb_p))

</div>

<div>

  });

</div>

<div>

    

</div>

<div>

  override def desiredName() : String = typename;

</div>

</div>

<div>

Here's the interface declaration. Note that we have vectors of address base and limit for address decode, then vectors of master and slave interfaces. Note the 'Flipped' method that reverses the Input/Output direction of elements within a bundle.

</div>

<div>

Now, what we're building is effectively shown below. Each slave interface has an associated arbiter that is connected to all masters. Fortunately, Chisel provides an Arbiter as a built-in element of the class library.

</div>

<div>

[<img src="/legacy-img/Untitled_2Bdrawing_2B_25281_2529.jpg" width="400" height="206" />](http://4.bp.blogspot.com/-9iv6eBLKTEo/WYKLSe9KCmI/AAAAAAAAB_s/h3b5JCTevOYRSywom0hB6x1x4hY-EJBuwCK4BGAYYCw/s1600/Untitled%2Bdrawing%2B%25281%2529.jpg)

</div>

<div>

<div>

  val in_rsp = Seq.fill(p.N_MASTERS) ( Wire(new WishboneMaster(p.wb_p) ))

</div>

<div>

  val out_rsp = Seq.fill(p.N_SLAVES) ( Wire(new WishboneMaster(p.wb_p) ))

</div>

<div>

  

</div>

<div>

  for (i \<- 0 until p.N_MASTERS) {

</div>

<div>

    // Drive back to master

</div>

<div>

    in_rsp(i).assign_rsp2p(io.m(i));

</div>

<div>

  }

</div>

<div>

  

</div>

<div>

  val out_arb = Seq.fill(p.N_SLAVES) ( Module(new RRArbiter(

</div>

<div>

      new WishboneMaster(p.wb_p), p.N_MASTERS)) )

</div>

</div>

<div>

This code creates a couple of temp arrays for routing the response back from the slave to the master, as well as an array of per-slave interface arbiters.

</div>

<div>

<div>

  // For each slave, hook up all masters

</div>

<div>

  for (i \<- 0 until p.N_SLAVES) {

</div>

<div>

    for (j \<- 0 until p.N_MASTERS) {

</div>

<div>

      val m_sel = io.addr_base.indexWhere((p:UInt) =\> (io.m(j).ADR \>= p))

</div>

<div>

      val m_ex = (io.addr_base.exists((p:UInt) =\> (io.m(j).ADR \>= p)) &&

</div>

<div>

          io.addr_limit.exists((p:UInt) =\> (io.m(j).ADR \<= p)));

</div>

<div>

      out_arb(i).io.in(j).bits.assign_p2req(io.m(j))

</div>

<div>

  

</div>

<div>

      when (m_ex && m_sel === i.asUInt()) {

</div>

<div>

        out_arb(i).io.in(j).valid := Bool(true);

</div>

<div>

      } .otherwise {

</div>

<div>

        out_arb(i).io.in(j).valid := Bool(false);

</div>

<div>

      }

</div>

<div>

      

</div>

<div>

      // Propagate slave response back to active master

</div>

<div>

      when (out_arb(i).io.in(j).ready /\* out_arb(i).io.in(j).valid && 

</div>

<div>

          out_arb(i).io.chosen === j.asUInt() \*/) {

</div>

<div>

          in_rsp(j) := out_rsp(i);

</div>

<div>

      } .otherwise {

</div>

<div>

          in_rsp(j).park_rsp();

</div>

<div>

      }

</div>

<div>

    }

</div>

<div>

    out_arb(i).io.out.bits.assign_req2p(io.s(i));

</div>

<div>

  }

</div>

<div>

}

</div>

</div>

<div>

Finally, we do the address decode to determine which slave a master's request address selects, and connect everything up to the arbiters. Note how simple it is to query the base/limit address arrays! The 'm_ex' field is true if the master is selecting a valid slave, while the 'm_sel' field holds the target index.

</div>

### Generating RTL

<div>

One of the things I spent far too much time on was finding out how to generate Verilog from my Chisel description. Turns out the incantation is quite simple once you know what it is:

</div>

<div>

<div>

object WishboneInterconnectDriver extends App {

</div>

<div>

    var N_MASTERS = 2;

</div>

<div>

    var N_SLAVES = 4;

</div>

<div>

    var ADDR_WIDTH = 32;

</div>

<div>

    var DATA_WIDTH = 32;

</div>

<div>

 

</div>

<div>

  var typename = "wishbone_ic\_%d\_%d\_%dx%d".format(

</div>

<div>

      ADDR_WIDTH, DATA_WIDTH, N_MASTERS, N_SLAVES);

</div>

<div>

  

</div>

<div>

  chisel3.Driver.execute(args, () =\> new WishboneInterconnect(

</div>

<div>

      new WishboneInterconnectParameters(N_MASTERS, N_SLAVES,

</div>

<div>

          wb_p=new WishboneParameters(ADDR_WIDTH, DATA_WIDTH)

</div>

<div>

      ), typename)

</div>

<div>

  )

</div>

<div>

}

</div>

</div>

  
The code above calls the Chisel 'Driver', passing in an instance of the WishboneInterconnect class. The result of running this code is a set of files, one of which is the Verilog RTL. The output RTL is somewhat low-level -- and 1656 lines long (!). When it comes to debugging this, I'll be interested to how much this gets in the way. But, it's all sensible RTL at the end of the day...  

### Results

<div>

Okay, so the hand-coded SystemVerilog interconnect took a total of 326 lines of SystemVerilog code. But, a little over 100 of those were the per-slave arbiter. If we ignore those lines, we have 206 lines of SystemVerilog. The Chisel description is 56 lines of code. So, 3-6x less code, depending on whether you count or ignore the arbiter implementation. Not bad, and I'm definitely feeling more comfortable with Chisel after working through an example like this.

</div>

<div>

If you're interested, you can find the complete code on GitHub:

</div>

<div>

<https://github.com/mballance/wb_sys_ip>

</div>

<div>

This repository contains both the hand-coded SystemVerilog and the Chisel representation. 

</div>

### So, what did we learn?

<div>

Well, initial experiments certainly seem to bear out the productivity benefits of Chisel. Library elements, such as the arbiter module are a great productivity boost! Array operations raise the abstraction level.

</div>

<div>

Figuring out the basics can be a bit challenging. Even figuring out how to run the conversion to Verilog process took some digging. Because Chisel is embedded in another language, semantic errors tend to show up as Java exception errors, rather than nice high-level error messages.

</div>

<div>

So, thus far, some good and some bad. Over the next couple of posts, I plan to dig into a couple of other areas of comparison -- including verification of the RTL, and how efficiently hand-coded and Chisel-generated implementations synthesize. So, stay tuned for more.

</div>

<div>

Have you experimented at all with Chisel? Or, with other HDL alternatives for that matter. What has your experience been? 

</div>

<div>

</div>
