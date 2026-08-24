---
title: Writing a Task-Based Cocotb BFM
date: '2019-12-14T13:06:00.001-08:00'
tags:
- PyBFMs
- PyPi
- Python
- Cocotb
- Functional Verification
- Design Verification
- HDL
legacy: true
author: Matthew Ballance
blogger_id: tag:blogger.com,1999:blog-142675602739945566.post-4715231122925663126
blogger_orig_url: https://bitsbytesgates.blogspot.com/2019/12/writing-task-based-cocotb-bfm.html
modified_time: '2019-12-14T13:19:24.509-08:00'
image: https://1.bp.blogspot.com/-R-vTF4170VI/XfVNlh_cZJI/AAAAAAAACy4/ESELGTzOyngCVpEv7kUxYtjzfOCqnb44ACLcBGAsYHQ/s72-c/splash.png
syndicate: none
---

<div>

[![](/legacy-img/splash-6.png)](/legacy-img/splash-6.png)

</div>

  
  
**Background**  
The purpose of a Bus Functional Model (BFM) is to enable interacting with a design via a given protocol at a higher level of abstraction than the signal-level protocol, while knowing the bare minimum about the details of that protocol. Verification IP goes beyond these benefits to provide test plans, functional coverage, test sequence, and often protocol-specific benefits like compliance test suites.  
  
In order to realize any these benefits of having a BFM, one first needs to exist. So, let's take a look at what it takes to create a task-based Cocotb BFM for a very simple ready/valid protocol.  
  

<div>

[![](/legacy-img/ready_valid2.png)](/legacy-img/ready_valid2.png)

</div>

<div>

</div>

<div>

</div>

  
The ready/valid protocol is simple, but useful. Data is exchanged between two blocks on a clock edge when both ready and valid are active (high). The initiator controls the valid signal, the target controls the ready signal. That's all there is to the protocol.  
  
Before we get into the details, a few words about the structure of a task-based Cocotb BFM. There are two key components:  
  

- A Python class that provides the API used by the test writer, and defines the lower-level API used to actually interact with the HDL portion of the BFM
- An HDL module that performs the conversion between the commands sent from Python and signals, and vice-versa.

  
  

<div>

[![](/legacy-img/structure.png)](/legacy-img/structure.png)

</div>

  
Both of these aspects of a task-based BFM are collected together in a Python package that is typically named with the protocol implemented by the BFM (rv, or ready-valid, in this case).  
  
**Python API**  
  
The Python portion of a task-based Cocotb BFM is captured as a Python class. I use camel-case names for classes, so the ready/value output (initiator) BFM is ReadyValidDataOutBFM.  
  
class ReadyValidDataOutBFM():  
  
    def \_\_init\_\_(self):  
        self.busy = Lock()  
        self.ack_ev = Event()  
The two core data items shown in the class initializer are likely to be found in every BFM. Cocotb supports multi-threaded tests using Python co-routines. Our BFM will use the 'busy' lock to ensure that only one Python thread can use the BFM at a time. It will use the 'ack_ev' event to interact with the HDL portion of the BFM.  
  
As I mentioned earlier, there are typically two API layers that we need to define: the API that the user calls, and a lower-level API that is used to control the BFM's HDL code inside the simulation.  
  
Let's start with the user layer, since that's quite simple. The user's test will use the ready/valid initiator BFM to write data to a target ready/valid interface. Let's call the public method 'write_c', to denote that this is a Python co-routine that writes data out from the BFM.  
  
   @cocotb.coroutine  
    def write_c(self, data):  
        '''  
        Writes the specified data word to the interface  
        '''  
          
        yield self.busy.acquire()  
        self.\_write_req(data)  
  
        \# Wait for acknowledge of the transfer  
        yield self.ack_ev.wait()  
        self.ack_ev.clear()  
  
        self.busy.release()  
  
Before getting into the implementation details, let's look at the second API layer -- the one that interacts directly with the BFM. The low-level API must be non-blocking in order to work with the full range of simulation and execution environments that must be supported. This means that we need to split the write operation into two pieces: an outbound call to initiate a write, and an inbound call from the BFM to notify that the write is complete.  
  
    @cocotb.bfm_import(cocotb.bfm_uint32_t)  
    def \_write_req(self, d):  
        pass  
      
    @cocotb.bfm_export()  
    def \_write_ack(self):  
        self.ack_ev.set()  
  
Note that the low-level API functions are prefixed with '\_', denoting that this is an internal API and not intended to be called directly by the user.  
  
  
  
**HDL BFM**  
**  
**The HDL portion of the BFM also has two aspects. One is synchronous synthesizable code, while the other implements the interface to the synchronous code. Both of these are contained within a Verilog module, shown below:  
  
module rv_data_out_bfm \#(  
  parameter DATA_WIDTH = 8  
) (  
  input clock,  
  input reset,  
  output reg\[DATA_WIDTH-1:0\] data,  
  output reg data_valid,  
  input data_ready  
);  
  
reg\[DATA_WIDTH-1:0\] data_v = 0;  
reg data_valid_v = 0;  
  
This module is instantiated in the HDL testbench and connected to the signals on the appropriate design interface. The *data_v* and *data_valid_v* variables are used to interface between the synchronous and control code inside the BFM.  
  
We'll look at the interface code first. The Verilog task below implements the Python *\_write_reg* method shown above.  
  
task \_write_req(reg\[63:0\] d);  
begin  
data_v = d;  
data_valid_v = 1;  
end  
endtask  
  

<div>

Note that the interface task is non-blocking, and simply sets values on variables within the module -- in this case, storing the data to be written and indicating that there is new data to transfer.

</div>

<div>

The synchronous logic controls the module signals based on the variables set by the interface tasks. This code is shown below:

</div>

<div>

<div>

always @(posedge clock) begin

</div>

<div>

  if (reset) begin

</div>

<div>

    data_valid \<= 0;

</div>

<div>

    data \<= 0;

</div>

<div>

  end else begin

</div>

<div>

    data_valid \<= data_valid_v;

</div>

<div>

    data \<= data_v;

</div>

<div>

</div>

<div>

          if (data_valid && data_ready) begin

</div>

<div>

      \_write_ack();

</div>

<div>

      data_valid_v = 0;

</div>

<div>

    end

</div>

<div>

  end

</div>

<div>

end

</div>

</div>

<div>

This synchronous logic propagates the variables that were set in the interface task. When both the data_valid and data_ready signals are high, the \_write_ack() task is called to notify the Python environment that the write is completed. At the same time the data_valid_v variable is cleared to terminate the transfer. 

</div>

<div>

Note that the synchronous logic is likely very similar to the logic within an RTL implementation of a ready/valid initiator. This is an opportunity, since it means that Cocotb BFMs can leverage existing RTL implementations of interface protocols.

</div>

  
**Publishing**  
Now that we have a ready/valid BFM implemented, what can we do with it? Well, in addition to using it to verify our current design, we can also share it with others that also have ready/valid interfaces on their designs. This is Python, after all, and it's very easy to share Python libraries with others via the PyPi repository (<https://pypi.org/>).  
  
In order to do this, we need to setup a very basic 'setup.py' script in our project directory that identifies the Python package and related data (BFM RTL) that needs to be distributed. After that, it's a simple matter to publish to PyPi such that another project can make use of the BFM simply by adding *rv_bfms* to that project's *requirements.txt* file.  
  

<div>

**Next Steps**  
Hopefully the description above shows just how simple it is to setup a Python BFM that can interact at the task level with RTL. You can find the full code for this BFM in the rv_bfms Github repository here: <https://github.com/pybfms/rv_bfms>.  
  
In my next post, we'll take a look at some more-advanced ways to structure BFMs to increase the overall performance even more, and see some ways for BFMs to add more value in debug.  
  
Meanwhile, I'd be interested to hear what protocols are of high interest in your FOSSi (Free and Open-Source Silicon) projects. I'd be especially interested if you'd like to contribute a task-based Python BFM for one or more of those protocols!  
  
  

<div>

<div>

***Disclaimer***

</div>

<div>

*The views and opinions expressed above are solely those of the author and do not represent those of my employer or any other party.*

</div>

</div>

  

</div>
