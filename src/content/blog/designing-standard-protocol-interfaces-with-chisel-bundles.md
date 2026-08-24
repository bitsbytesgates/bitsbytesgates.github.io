---
title: Designing Standard-protocol Interfaces with Chisel Bundles
date: '2017-10-02T10:24:00.000-07:00'
tags:
- Chisel
- Chisel3
- higher-level design
- SystemVerilog
- design abstraction
legacy: true
author: Matthew Ballance
blogger_id: tag:blogger.com,1999:blog-142675602739945566.post-2798536707613504072
blogger_orig_url: https://bitsbytesgates.blogspot.com/2017/10/designing-standard-protocol-interfaces.html
modified_time: '2017-10-02T10:24:06.211-07:00'
image: https://1.bp.blogspot.com/-kZonK_HUEao/Wc_XfoFFrYI/AAAAAAAACEM/NQNpTqanWWocSn52Qr2Bb84nzJh4VA_FQCLcBGAs/s72-c/plugboard_2.jpg
syndicate: none
---

<div>

[<img src="/legacy-img/plugboard_2.jpg" width="320" height="213" />](https://1.bp.blogspot.com/-kZonK_HUEao/Wc_XfoFFrYI/AAAAAAAACEM/NQNpTqanWWocSn52Qr2Bb84nzJh4VA_FQCLcBGAs/s1600/plugboard_2.jpg)

</div>

<div>

Standard interfaces are all around us, and enhance interoperability between devices created by different organizations. While some standard interfaces are quite niche in nature, others, like the unbiquitous phono jack, have been used for many applications that are only slightly related. 

</div>

<div>

When it comes to design and reuse of design IP, using higher-level interfaces (certainly higher-level that just a set of wires) helps to make use and reuse of the IP easier. An IP that connects with the rest of the design via interfaces is easier to understand than a block that has a wire-level interface -- even if those hundreds of wires are equivalent to several high-level interfaces. Connecting an IP with top-level interfaces to the rest of the design is much easier and trouble-free than individually connecting hundreds of signals. 

</div>

- 

<div>

SystemVerilog provides the interface construct as both a design and a verification feature. A SystemVerilog interface describes the low-level signals of which the interface is composed. The ways in which those signals can be used (eg initiator vs target) are captured using a modport. 

</div>

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<tbody>
<tr class="odd">
<td><div class="MsoNormal">
<span class="GramE"><strong><span>interface</span></strong></span><span> <span class="SpellE">wb_if</span> #(</span><span></span>
</div>
<div class="MsoNormal">
<span>              </span><span class="GramE"><strong><span>parameter</span></strong></span><span> </span><span class="SpellE"><strong><span>int</span></strong></span><span> WB_ADDR_WIDTH = 32,</span><span></span>
</div>
<div class="MsoNormal">
<span>              </span><span class="GramE"><strong><span>parameter</span></strong></span><span> </span><span class="SpellE"><strong><span>int</span></strong></span><span> WB_TGA_WIDTH = 1,</span><span></span>
</div>
<div class="MsoNormal">
<span>              </span><span class="GramE"><strong><span>parameter</span></strong></span><span> </span><span class="SpellE"><strong><span>int</span></strong></span><span> WB_DATA_WIDTH = 32,</span><span></span>
</div>
<div class="MsoNormal">
<span>              </span><span class="GramE"><strong><span>parameter</span></strong></span><span> </span><span class="SpellE"><strong><span>int</span></strong></span><span> WB_TGD_WIDTH = 1,</span><span></span>
</div>
<div class="MsoNormal">
<span>              </span><span class="GramE"><strong><span>parameter</span></strong></span><span> </span><span class="SpellE"><strong><span>int</span></strong></span><span> WB_TGC_WIDTH = 1</span><span></span>
</div>
<div class="MsoNormal">
<span>              );</span><span></span>
</div>
<div class="MsoNormal">
<span>      </span><span></span>
</div>
<div class="MsoNormal">
<span>       </span><span class="SpellE"><span class="GramE"><strong><span>reg</span></strong></span></span><span class="GramE"><span>[</span></span><span>(WB_ADDR_WIDTH-1):0]                 ADR;</span><span></span>
</div>
<div class="MsoNormal">
<span>       </span><span class="SpellE"><span class="GramE"><strong><span>reg</span></strong></span></span><span class="GramE"><span>[</span></span><span>(WB_TGA_WIDTH-1):0]                  TGA;</span><span></span>
</div>
<div class="MsoNormal">
<span>       </span><span class="SpellE"><span class="GramE"><strong><span>reg</span></strong></span></span><span class="GramE"><span>[</span></span><span>2:0]                                 CTI;</span><span></span>
</div>
<div class="MsoNormal">
<span>       </span><span class="SpellE"><span class="GramE"><strong><span>reg</span></strong></span></span><span class="GramE"><span>[</span></span><span>1:0]                                 BTE;</span><span></span>
</div>
<div class="MsoNormal">
<span>       </span><span class="SpellE"><span class="GramE"><strong><span>reg</span></strong></span></span><span class="GramE"><span>[</span></span><span>(WB_DATA_WIDTH-1):0]                 DAT_W;</span><span></span>
</div>
<div class="MsoNormal">
<span>       </span><span class="SpellE"><span class="GramE"><strong><span>reg</span></strong></span></span><span class="GramE"><span>[</span></span><span>(WB_TGD_WIDTH-1):0]                  TGD_W;</span><span></span>
</div>
<div class="MsoNormal">
<span>       </span><span class="SpellE"><span class="GramE"><strong><span>reg</span></strong></span></span><span class="GramE"><span>[</span></span><span>(WB_DATA_WIDTH-1):0]                 DAT_R;</span><span></span>
</div>
<div class="MsoNormal">
<span>       </span><span class="SpellE"><span class="GramE"><strong><span>reg</span></strong></span></span><span class="GramE"><span>[</span></span><span>(WB_TGD_WIDTH-1):0]                  TGD_R;</span><span></span>
</div>
<div class="MsoNormal">
<span>       </span><span class="SpellE"><span class="GramE"><strong><span>reg</span></strong></span></span><span>                                      CYC;</span><span></span>
</div>
<div class="MsoNormal">
<span>       </span><span class="SpellE"><span class="GramE"><strong><span>reg</span></strong></span></span><span class="GramE"><span>[</span></span><span>(WB_TGC_WIDTH-1):0]                  TGC;</span><span></span>
</div>
<div class="MsoNormal">
<span>       </span><span class="SpellE"><span class="GramE"><strong><span>reg</span></strong></span></span><span>                                      ERR;</span><span></span>
</div>
<div class="MsoNormal">
<span>       </span><span class="SpellE"><span class="GramE"><strong><span>reg</span></strong></span></span><span class="GramE"><span>[</span></span><span>(WB_DATA_WIDTH/8)-1:0]               SEL;</span><span></span>
</div>
<div class="MsoNormal">
<span>       </span><span class="SpellE"><span class="GramE"><strong><span>reg</span></strong></span></span><span>                                      STB;</span><span></span>
</div>
<div class="MsoNormal">
<span>       </span><span class="SpellE"><span class="GramE"><strong><span>reg</span></strong></span></span><span>                                      ACK;</span><span></span>
</div>
<div class="MsoNormal">
<span>       </span><span class="SpellE"><strong><span>reg</span></strong></span><span>                                      WE;</span><span></span>
</div>
<div class="MsoNormal">
<br />
&#10;</div>
<div class="MsoNormal">
<span>       </span><span class="SpellE"><span class="GramE"><strong><span>modport</span></strong></span></span><span> master(</span><span></span>
</div>
<div class="MsoNormal">
<span>                     </span><span class="GramE"><strong><span>output</span></strong></span><span>        ADR,</span><span></span>
</div>
<div class="MsoNormal">
<span>                     </span><span class="GramE"><strong><span>output</span></strong></span><span>        TGA,</span><span></span>
</div>
<div class="MsoNormal">
<span>                     </span><span class="GramE"><strong><span>output</span></strong></span><span>        CTI,</span><span></span>
</div>
<div class="MsoNormal">
<span>                     </span><span class="GramE"><strong><span>output</span></strong></span><span>        BTE,</span><span></span>
</div>
<div class="MsoNormal">
<span>                     </span><span class="GramE"><strong><span>output</span></strong></span><span>        DAT_W,</span><span></span>
</div>
<div class="MsoNormal">
<span>                     </span><span class="GramE"><strong><span>output</span></strong></span><span>        TGD_W,</span><span></span>
</div>
<div class="MsoNormal">
<span>                     </span><span class="GramE"><strong><span>input</span></strong></span><span>         DAT_R,</span><span></span>
</div>
<div class="MsoNormal">
<span>                     </span><span class="GramE"><strong><span>output</span></strong></span><span>        TGD_R,</span><span></span>
</div>
<div class="MsoNormal">
<span>                     </span><span class="GramE"><strong><span>output</span></strong></span><span>        CYC,</span><span></span>
</div>
<div class="MsoNormal">
<span>                     </span><span class="GramE"><strong><span>output</span></strong></span><span>        TGC,</span><span></span>
</div>
<div class="MsoNormal">
<span>                     </span><span class="GramE"><strong><span>input</span></strong></span><span>         ERR,</span><span></span>
</div>
<div class="MsoNormal">
<span>                     </span><span class="GramE"><strong><span>output</span></strong></span><span>        SEL,</span><span></span>
</div>
<div class="MsoNormal">
<span>                     </span><span class="GramE"><strong><span>output</span></strong></span><span>        STB,</span><span></span>
</div>
<div class="MsoNormal">
<span>                     </span><span class="GramE"><strong><span>input</span></strong></span><span>         ACK,</span><span></span>
</div>
<div class="MsoNormal">
<span>                     </span><span class="GramE"><strong><span>output</span></strong></span><span>        WE);</span><span></span>
</div>
<div class="MsoNormal">
<span>      </span><span></span>
</div>
<div class="MsoNormal">
<span>    <strong>...</strong>             </span><span></span>
</div>
<div class="MsoNormal">
<br />
&#10;</div>
```
endinterface
```</td>
</tr>
</tbody>
</table>

<div>

An example of a Wishbone SV interface is shown above, with just the 'master' modport shown. As you can see, parameters are specified on the interface declaration, core signals are declared without direction, and directions for different uses of the signals are specified via modport declarations.  
  
Chisel provides the Bundle construct to group signals together. While the concept and high-level use of a Chisel Bundle is quite similar to a SystemVerilog interface, there are some significant differences. This blog captures the best practices that I've discovered thus far while describing Chisel bundles for standard interfaces.  
  

### SV Interfaces vs Chisel Bundles

<div>

If you've spent time working with SystemVerilog interfaces already, understanding the differences between SV Interfaces and Chisel Bundles will likely make the best practices below make more sense. 

</div>

<div>

While SystemVerilog provides the modport construct for describing a usage of a interface, Chisel doesn't have a similar notion. All signals in a Chisel bundle are given a direction. Bundles may be instantiated as-is, or instantiated 'Flipped' with reversed signal directions.

</div>

<div>

Chisel bundles can be hierarchical, so a bundle type can be composed of several instances of other bundle types. In contrast, a SystemVerilog interface must effectively be single-level.

</div>

<div>

Being an object-oriented language, Chisel allows methods to be defined on a bundle type that assign values to the bundle signals. This can be very useful by making it easy for the user of a bundle type to drive the bundle signals to a useful state.

</div>

  

### Chisel Bundle Best Practices

</div>

<div>

At the end of this blog post is a Chisel description of a Wishbone interface, which I'll refer to in the best practices description below.

</div>

#### 

### Describe from the Initiator's Perspective

<div>

Since signal directions are specified on the signals of a Chisel bundle, it's helpful to be consistent in picking either the initiator or the target and describing all interfaces in those terms. I've picked the initiator as the standard perspective to use. 

</div>

<div>

Note that the Wishbone signal directions are captured from the initiator's (master's) perspective. For example, ADR and CYC are outputs, while DAT_R and ACK are inputs.

</div>

### Collect Related Signals in a Sub-Bundle

<div>

Users of a standard interface will often benefit from working with sub-elements of the protocol. Declaring this sub-elements as part of the interface declaration can be very helpful. Since some Chisel elements (such as the Mux) expect all elements of a bundle to have the same direction, it's important that all elements of a sub-bundle have the same direction. In the Wishbone example above, I've created a 'ReqData' bundle to capture all signals related to the transaction request, and a 'RspData' bundle to capture all signals related to the transaction response.

</div>

### Collect Protocol Parameters into a Parameters Class

<div>

Standard protocols are often parameters. For example, the Wishbone address, data, and tag widths are variable. Collecting protocol parameters into a class, instead of passing them individually to the bundle constructor, has two key benefits:

</div>

- Less typing when creating multiple instances of the interface with the same parameterization
- It's easier to create the 'cloneType' method (see next tip), and this can even be placed in a base class if you prefer

### Define a cloneType Method

<div>

Chisel needs to clone Bundle objects for several reasons. A parameterized standard interface bundle must provide a cloneType method to ensure that the proper parameters are used when the interface bundle is cloned. You can see the definition of the cloneType method above.

</div>

### Provide tieoff and tieoff_flipped Methods

<div>

It should be easy for any users of a standard interface to tie-off that interface. In other words, effectively disable the interface. The tieoff() method is used for initiator interfaces. As you can see, tieoff() drives the response signals to inactive values. The tieoff_flipped() method is used for target interfaces. As you can see, tieoff_flipped() drives the request signals (ADR, CYC, etc) to inactive values.

</div>

<div>

Note that if a clock or reset must be applied to an interface for it to function properly, the tieoff() method can accept handles to these required signals.

</div>

### Provide Utility Methods

<div>

The ability to provide utility methods for driving interface signals to pre-defined states helps minimize the code an IP must write. In the case of Wishbone, setting the error-response state is done directly by the set_error() method. Any IP that needs to return an error can call this method to set the appropriate values.

</div>

  
I've found the best practices above to be helpful in structuring interfaces that are easily reusable. If you've been working with Chisel, what best practices have you discovered in working with Chisel bundles?  
  

<div>

### Chisel Bundle for a Wishbone Interface

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<tbody>
<tr class="odd">
<td><div class="MsoNormal">
<div class="MsoNormal">
<span class="GramE"><strong><span>class</span></strong></span><span> Wishbone(</span><span class="SpellE"><strong><span>val</span></strong></span><span> </span><span>p</span><span> : <span class="SpellE">Wishbone.Parameters</span>) </span><strong><span>extends</span></strong><span> Bundle {</span><span></span>
</div>
<div class="MsoNormal">
<br />
&#10;</div>
<div class="MsoNormal">
<strong><span>  <span class="SpellE"><span class="GramE">val</span></span></span></strong><span> </span><span class="SpellE"><span>req</span></span><span> = </span><strong><span>new</span></strong><span> <span class="SpellE">Wishbone.ReqData</span>(</span><span>p</span><span>)</span><span></span>
</div>
<div class="MsoNormal">
<strong><span>  <span class="SpellE"><span class="GramE">val</span></span></span></strong><span> </span><span class="SpellE"><span>rsp</span></span><span> = </span><strong><span>new</span></strong><span> <span class="SpellE">Wishbone.RspData</span>(</span><span>p</span><span>)</span><span></span>
</div>
<div class="MsoNormal">
<span>      </span><span></span>
</div>
<div class="MsoNormal">
<span>  </span><span class="GramE"><strong><span>override</span></strong></span><span> </span><span class="SpellE"><strong><span>def</span></strong></span><span> <span class="SpellE">cloneType</span>() : </span><span class="SpellE"><strong><span>this</span></strong><span>.</span><strong><span>type</span></strong></span><span> = {</span><span></span>
</div>
<div class="MsoNormal">
<span>         </span><span class="GramE"><strong><span>return</span></strong></span><span> </span><strong><span>new</span></strong><span> Wishbone(</span><span>p</span><span>).<span class="SpellE">asInstanceOf</span>[</span><span class="SpellE"><strong><span>this</span></strong><span>.</span><strong><span>type</span></strong></span><span>]</span><span></span>
</div>
<div class="MsoNormal">
<span>  }   </span>
</div>
<div class="MsoNormal">
<strong><span>  <span class="SpellE"><span class="GramE">def</span></span></span></strong><span> <span class="SpellE">tieoff</span>() {</span><span></span>
</div>
<div class="MsoNormal">
<span>    <span class="SpellE"><span class="GramE">rsp<span>.tieoff</span></span></span></span><span class="GramE"><span>()</span></span><span></span>
</div>
<div class="MsoNormal">
<span>  }</span><span></span>
</div>
<div class="MsoNormal">
<span>      </span><span></span>
</div>
<div class="MsoNormal">
<strong><span>  <span class="SpellE"><span class="GramE">def</span></span></span></strong><span> <span class="SpellE">tieoff_flipped</span>() {</span><span></span>
</div>
<div class="MsoNormal">
<span>    </span><span class="SpellE"><span>req</span><span>.tieoff_<span class="GramE">flipped</span></span></span><span class="GramE"><span>()</span></span><span></span>
</div>
<div class="MsoNormal">
<span>  }</span><span></span>
</div>
<div class="MsoNormal">
<span>}</span><span></span>
</div>
<div class="MsoNormal">
<span class="GramE"><strong><span>object</span></strong></span><span> Wishbone {</span><span></span>
</div>
<div class="MsoNormal">
<span class="GramE"><strong><span>class</span></strong></span><span> Parameters (</span><span></span>
</div>
<div class="MsoNormal">
<span>    </span><span class="SpellE"><span class="GramE"><strong><span>val</span></strong></span></span><span> </span><span>ADDR_WIDTH</span><span>  :  <span class="SpellE">Int</span>=</span><span>32</span><span>,</span><span></span>
</div>
<div class="MsoNormal">
<span>    </span><span class="SpellE"><span class="GramE"><strong><span>val</span></strong></span></span><span> </span><span>DATA_WIDTH</span><span>  :  <span class="SpellE">Int</span>=</span><span>32</span><span>,</span><span></span>
</div>
<div class="MsoNormal">
<span>    </span><span class="SpellE"><span class="GramE"><strong><span>val</span></strong></span></span><span> </span><span>TGA_WIDTH</span><span>   :  <span class="SpellE">Int</span>=</span><span>1</span><span>,</span><span></span>
</div>
<div class="MsoNormal">
<span>    </span><span class="SpellE"><span class="GramE"><strong><span>val</span></strong></span></span><span> </span><span>TGD_WIDTH</span><span>   :  <span class="SpellE">Int</span>=</span><span>1</span><span>,</span><span></span>
</div>
<div class="MsoNormal">
<span>    </span><span class="SpellE"><span class="GramE"><strong><span>val</span></strong></span></span><span> </span><span>TGC_WIDTH</span><span>   :  <span class="SpellE">Int</span>=</span><span>1</span><span>) { }</span><span></span>
</div>
<div class="MsoNormal">
<br />
&#10;</div>
<div class="MsoNormal">
<span class="GramE"><strong><span>class</span></strong></span><span> <span class="SpellE">RspData</span>(</span><strong><span>override</span></strong><span> </span><span class="SpellE"><strong><span>val</span></strong></span><span> </span><span>p</span><span> : <span class="SpellE">Wishbone.Parameters</span>) </span><strong><span>extends</span></strong><span> Bundle {</span><span></span>
</div>
<div class="MsoNormal">
<strong><span>  <span class="SpellE"><span class="GramE">val</span></span></span></strong><span> </span><span>DAT_R</span><span> = </span><span>Input</span><span>(<span class="SpellE">UInt</span>(</span><span class="SpellE"><u><span>p</span><span>.</span><span>DATA_WIDTH</span></u><span>.W</span></span><span>))</span><span></span>
</div>
<div class="MsoNormal">
<strong><span>  <span class="SpellE"><span class="GramE">val</span></span></span></strong><span> </span><span>TGD_R</span><span> = </span><span>Input</span><span>(<span class="SpellE">UInt</span>(</span><span class="SpellE"><u><span>p</span><span>.</span><span>TGD_WIDTH</span></u><span>.W</span></span><span>))</span><span></span>
</div>
<div class="MsoNormal">
<strong><span>  <span class="SpellE"><span class="GramE">val</span></span></span></strong><span> </span><span>ERR</span><span> = </span><span>Input</span><span>(<span class="SpellE">Bool</span>())</span><span></span>
</div>
<div class="MsoNormal">
<strong><span>  <span class="SpellE"><span class="GramE">val</span></span></span></strong><span> </span><span>ACK</span><span> = </span><span>Input</span><span>(<span class="SpellE">Bool</span>())   </span><span></span>
</div>
<div class="MsoNormal">
<br />
&#10;</div>
<div class="MsoNormal">
<strong><span>  <span class="GramE">override</span></span></strong><span> </span><span class="SpellE"><strong><span>def</span></strong></span><span> <span class="SpellE">cloneType</span>() : </span><span class="SpellE"><strong><span>this</span></strong><span>.</span><strong><span>type</span></strong></span><span> = {</span><span></span>
</div>
<div class="MsoNormal">
<span>    </span><span class="GramE"><strong><span>return</span></strong></span><span> </span><strong><span>new</span></strong><span> <span class="SpellE">RspData</span>(</span><span>p</span><span>).<span class="SpellE">asInstanceOf</span>[</span><span class="SpellE"><strong><span>this</span></strong><span>.</span><strong><span>type</span></strong></span><span>]</span><span></span>
</div>
<div class="MsoNormal">
<span>  }</span>
</div>
<div class="MsoNormal">
<br />
&#10;</div>
<div class="MsoNormal">
<strong><span>  <span class="SpellE"><span class="GramE">def</span></span></span></strong><span> <span class="SpellE">tieoff</span>() {</span><span></span>
</div>
<div class="MsoNormal">
<span>    DAT_<span class="GramE">R<span> :</span></span></span><span>= </span><u><span>0</span></u><span>.asUInt();</span><span></span>
</div>
<div class="MsoNormal">
<span>    </span><span>TGD_<span class="GramE">R<span> :</span></span></span><span>= </span><u><span>0</span></u><span>.asUInt();</span><span></span>
</div>
<div class="MsoNormal">
<span>    <span class="GramE">ERR<span> :=</span></span></span><span> <span class="SpellE">Bool</span>(</span><strong><span>false</span></strong><span>);</span><span></span>
</div>
<div class="MsoNormal">
<span>    <span class="GramE">ACK<span> :=</span></span></span><span> <span class="SpellE">Bool</span>(</span><strong><span>false</span></strong><span>);</span><span></span>
</div>
<div class="MsoNormal">
<span>  }</span><span></span>
</div>
<div class="MsoNormal">
<br />
&#10;</div>
<div class="MsoNormal">
<strong><span>  <span class="SpellE"><span class="GramE">def</span></span></span></strong><span> <span class="SpellE">set_error</span>() {</span><span></span>
</div>
<div class="MsoNormal">
<span>    <span class="GramE">ERR<span> :=</span></span></span><span> <span class="SpellE">Bool</span>(</span><strong><span>true</span></strong><span>);</span>
</div>
<div class="MsoNormal">
<span>    </span><span class="GramE"><span>ACK</span><span> :=</span></span><span> <span class="SpellE">Bool</span>(</span><strong><span>true</span></strong><span>);</span><span></span>
</div>
<div class="MsoNormal">
<span>  }</span><span></span>
</div>
<div class="MsoNormal">
<span>}</span><span></span>
</div>
<div class="MsoNormal">
<br />
&#10;</div>
<div class="MsoNormal">
<span class="GramE"><strong><span>class</span></strong></span><span> <span class="SpellE">ReqData</span>(</span><strong><span>override</span></strong><span> </span><span class="SpellE"><strong><span>val</span></strong></span><span> </span><span>p</span><span> : <span class="SpellE">Wishbone.Parameters</span>) </span><strong><span>extends</span></strong><span> Bundle {</span><span></span>
</div>
<div class="MsoNormal">
<strong><span>  <span class="SpellE"><span class="GramE">val</span></span></span></strong><span> </span><span>ADR</span><span> = </span><span>Output</span><span>(<span class="SpellE">UInt</span>(</span><span class="SpellE"><u><span>p</span><span>.</span><span>ADDR_WIDTH</span></u><span>.W</span></span><span>))</span><span></span>
</div>
<div class="MsoNormal">
<strong><span>  <span class="SpellE"><span class="GramE">val</span></span></span></strong><span> </span><span>TGA</span><span> = </span><span>Output</span><span>(<span class="SpellE">UInt</span>(</span><span class="SpellE"><u><span>p</span><span>.</span><span>TGA_WIDTH</span></u><span>.W</span></span><span>))</span><span></span>
</div>
<div class="MsoNormal">
<strong><span>  <span class="SpellE"><span class="GramE">val</span></span></span></strong><span> </span><span>CTI</span><span> = </span><span>Output</span><span>(<span class="SpellE">UInt</span>(</span><u><span>3</span></u><span>.W))</span><span></span>
</div>
<div class="MsoNormal">
<strong><span>  <span class="SpellE"><span class="GramE">val</span></span></span></strong><span> </span><span>BTE</span><span> = </span><span>Output</span><span>(<span class="SpellE">UInt</span>(</span><u><span>2</span></u><span>.W))</span><span></span>
</div>
<div class="MsoNormal">
<strong><span>  <span class="SpellE"><span class="GramE">val</span></span></span></strong><span> </span><span>DAT_W</span><span> = </span><span>Output</span><span>(<span class="SpellE">UInt</span>(</span><span class="SpellE"><u><span>p</span><span>.</span><span>DATA_WIDTH</span></u><span>.W</span></span><span>))</span><span></span>
</div>
<div class="MsoNormal">
<strong><span>  <span class="SpellE"><span class="GramE">val</span></span></span></strong><span> </span><span>TGD_W</span><span> = </span><span>Output</span><span>(<span class="SpellE">UInt</span>(</span><span class="SpellE"><u><span>p</span><span>.</span><span>TGD_WIDTH</span></u><span>.W</span></span><span>))</span><span></span>
</div>
<div class="MsoNormal">
<strong><span>  <span class="SpellE"><span class="GramE">val</span></span></span></strong><span> </span><span>CYC</span><span> = </span><span>Output</span><span>(<span class="SpellE">Bool</span>())</span><span></span>
</div>
<div class="MsoNormal">
<strong><span>  <span class="SpellE"><span class="GramE">val</span></span></span></strong><span> </span><span>TGC</span><span> = </span><span>Output</span><span>(<span class="SpellE">UInt</span>(</span><span class="SpellE"><u><span>p</span><span>.</span><span>TGC_WIDTH</span></u><span>.W</span></span><span>))</span><span></span>
</div>
<div class="MsoNormal">
<strong><span>  <span class="SpellE"><span class="GramE">val</span></span></span></strong><span> </span><span>SEL</span><span> = </span><span>Output</span><span>(<span class="SpellE">UInt</span>((</span><span class="SpellE"><u><span>p</span><span>.</span><span>DATA_WIDTH</span></u></span><u><span>/</span><span>8</span></u><span>).W))</span><span></span>
</div>
<div class="MsoNormal">
<strong><span>  <span class="SpellE"><span class="GramE">val</span></span></span></strong><span> </span><span>STB</span><span> = </span><span>Output</span><span>(<span class="SpellE">Bool</span>())</span><span></span>
</div>
<div class="MsoNormal">
<strong><span>  <span class="SpellE"><span class="GramE">val</span></span></span></strong><span>  </span><span>WE</span><span> = </span><span>Output</span><span>(<span class="SpellE">Bool</span>())</span><span></span>
</div>
<div class="MsoNormal">
<span>      </span>
</div>
<div class="MsoNormal">
<strong><span>  <span class="SpellE"><span class="GramE">def</span></span></span></strong><span> <span class="SpellE">tieoff_flipped</span>() {</span><span></span>
</div>
<div class="MsoNormal">
<span>    </span><span class="GramE"><span>ADR</span><span> :=</span></span><span> </span><u><span>0</span></u><span>.asUInt()</span><span></span>
</div>
<div class="MsoNormal">
<span>    </span><span class="GramE"><span>TGA</span><span> :=</span></span><span> </span><u><span>0</span></u><span>.asUInt()</span><span></span>
</div>
<div class="MsoNormal">
<span>    </span><span class="GramE"><span>CTI</span><span> :=</span></span><span> </span><u><span>0</span></u><span>.asUInt()</span><span></span>
</div>
<div class="MsoNormal">
<span>    </span><span class="GramE"><span>BTE</span><span> :=</span></span><span> </span><u><span>0</span></u><span>.asUInt()</span><span></span>
</div>
<div class="MsoNormal">
<span>    </span><span>DAT_<span class="GramE">W<span> :</span></span></span><span>= </span><u><span>0</span></u><span>.asUInt()</span><span></span>
</div>
<div class="MsoNormal">
<span>    </span><span>TGD_<span class="GramE">W<span> :</span></span></span><span>= </span><u><span>0</span></u><span>.asUInt()</span><span></span>
</div>
<div class="MsoNormal">
<span>    </span><span class="GramE"><span>CYC</span><span> :=</span></span><span> <span class="SpellE">Bool</span>(</span><strong><span>false</span></strong><span>)</span><span></span>
</div>
<div class="MsoNormal">
<span>    </span><span class="GramE"><span>TGC</span><span> :=</span></span><span> </span><u><span>0</span></u><span>.asUInt()</span><span></span>
</div>
<div class="MsoNormal">
<span>    </span><span class="GramE"><span>SEL</span><span> :=</span></span><span> </span><u><span>0</span></u><span>.asUInt()</span><span></span>
</div>
<div class="MsoNormal">
<span>    </span><span class="GramE"><span>STB</span><span> :=</span></span><span> <span class="SpellE">Bool</span>(</span><strong><span>false</span></strong><span>)</span><span></span>
</div>
<div class="MsoNormal">
<span>    </span><span class="GramE"><span>CYC</span><span> :=</span></span><span> <span class="SpellE">Bool</span>(</span><strong><span>false</span></strong><span>)</span><span></span>
</div>
<div class="MsoNormal">
<span>    </span><span class="GramE"><span>WE</span><span> :=</span></span><span> <span class="SpellE">Bool</span>(</span><strong><span>false</span></strong><span>)</span><span></span>
</div>
<div class="MsoNormal">
<span>  }</span>
</div>
<div class="MsoNormal">
<br />
&#10;</div>
<div class="MsoNormal">
<span>  </span><span class="GramE"><strong><span>override</span></strong></span><span> </span><span class="SpellE"><strong><span>def</span></strong></span><span> <span class="SpellE">cloneType</span>() : </span><span class="SpellE"><strong><span>this</span></strong><span>.</span><strong><span>type</span></strong></span><span> = {</span><span></span>
</div>
<div class="MsoNormal">
<strong><span>    <span class="GramE">return</span></span></strong><span> </span><strong><span>new</span></strong><span> <span class="SpellE">ReqData</span>(</span><span>p</span><span>).<span class="SpellE">asInstanceOf</span>[</span><span class="SpellE"><strong><span>this</span></strong><span>.</span><strong><span>type</span></strong></span><span>]</span><span></span>
</div>
<div class="MsoNormal">
<span>  }   </span><span></span>
</div>
<div class="MsoNormal">
<span>}</span><span></span>
</div>
<div class="MsoNormal">
<span>}</span><br />
&#10;<div>
<span><br />
</span>
</div>
</div>
</div></td>
</tr>
</tbody>
</table>

</div>
