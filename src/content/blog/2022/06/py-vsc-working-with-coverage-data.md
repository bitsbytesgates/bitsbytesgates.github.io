---
title: 'PyVSC: Working with Coverage Data'
date: '2022-06-12T16:01:00.005-07:00'
tags:
- PyVSC
- PyUCIS
- UCIS
- Functional Coverage
- Python
legacy: true
author: Matthew Ballance
blogger_id: tag:blogger.com,1999:blog-142675602739945566.post-4339569767190659846
blogger_orig_url: https://bitsbytesgates.blogspot.com/2022/06/pyvsc-working-with-coverage-data.html
modified_time: '2022-06-12T19:45:43.440-07:00'
image: https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjq5wnj9yN65OUU7dsp8gm5PRovjwCZlQubAsXkkaEis47rG46JBgh0gaNcbGqXjUX0HbjZQd1nRKrIChY0X6x_pVn_vbvGHNWxKyFDRiEATtKA-HWvSGjqViM03kqSmXfOsXtEI1NrobfqM6Q1E-rAkNKXk4RqeJfAIR3Wi_tLDYutBFSiDxMU2VjOFg/s72-c/pyvsc_coverage.png
syndicate: none
---

<div>

[![](/legacy-img/pyvsc_coverage-2.png)](/legacy-img/pyvsc_coverage-2.png)

</div>

  

I’ve been investing some time in documentation updates this weekend, after a couple of [PyVSC](https://github.com/fvutils/pyvsc) users pointed out some under-described aspects of the PyVSC coverage flow. Given that these areas were under-documented in the past, it seemed a good opportunity to highlight what can be done with functional coverage data once it is sampled by a PyVSC covergroup.

So, we’ve described some functional coverage goals using a PyVSC covergroup and coverpoints, created a covergroup instance, and sampled some coverage data – perhaps it was randomly-generated stimulus or data sampled from a monitor. What now?

**Runtime Coverage API**

One simple thing we can do is to query coverage achieved using the coverage APIs implemented by PyVSC covergroup classes. The \`get_coverage\` method returns the coverage achieved by all instances of a covergroup type. The \`get_inst_coverage\` method returns the coverage achieved by the specified covergroup instance.

Let’s look at an example:

<div>

[<img src="/legacy-img/CoverageMethodsExample.png" width="640" height="410" />](/legacy-img/CoverageMethodsExample.png)

</div>

  

In the example above, we define a covergroup with a coverpoint that contains four bins (1, 2, 4, 8). We create two instances of this covergroup and sample them with two different values. After each call to sample, we display the coverage achieved by all instances of the covergroup (type coverage) and the coverage achieved by each instance.

<div>

[<img src="/legacy-img/CoverageMethodsExample_output.png" width="640" height="55" />](/legacy-img/CoverageMethodsExample_output.png)

</div>

  

The output from this example is shown above. After sampling the first covergroup, the coverage achieved for that, and all, instances is 25% since one of four bins was hit. After sampling the second covergroup, the coverage achieved for that covergroup instance is also 25%. Because two different bins are hit between the two covergroup instances, two of four bins are hit (50%) for type coverage.

  

**Runtime Coverage Reports**

Another way to look at collected coverage is via a coverage report. PyVSC provides two methods that are nearly identical for obtaining a textual coverage report:

- get_coverage_report – Returns the report as a string
- report_coverage – Writes the report to a string (stdout by default)

Both of these methods accept a keyword parameter named ‘details’ which controls whether bin hits are reported or just the top-level coverage achieved. Let’s look at a derivative of the first example to better understand the textual coverage report options.

<div>

[<img src="/legacy-img/CoverageReportExample.png" width="640" height="364" />](/legacy-img/CoverageReportExample.png)

</div>

  

This example is nearly identical to the first one, but with calls to ‘report_coverage’ instead of calls to the covergroup get_coverage methods.

<div>

[<img src="/legacy-img/CoverageReportExample_output.png" width="640" height="470" />](/legacy-img/CoverageReportExample_output.png)

</div>

  

The output from running this example is shown above. When reporting ‘details’ is enabled, the content of each coverage bin is reported. When reporting ‘details’ is disabled, only the top-level coverage achieved is reported. Displaying a coverage report with details is often helpful for confirming the correctness of a coverage model during development.

  

**Saving Coverage Data**

The [PyUCIS library](https://github.com/fvutils/pyucis) implements a Python interface to coverage data via the [Accellera UCIS](https://www.accellera.org/downloads/standards/ucis) data model. It implements an object-oriented interface to coverage data, in addition to the Python equivalent of the UCIS C API. PyVSC uses the PyUCIS library to save coverage data, and can do so in a couple of interesting ways. Coverage data is written via the vsc.write_coverage_db method.

PyVSC can save coverage data to the XML interchange format defined by the UCIS standard. This is the default operation model for write_coverage_db. The example below shows saving it to a file named  ‘cov.xml’. 

<div>

[<img src="/legacy-img/CoverageSave_xml.png" width="640" height="304" />](/legacy-img/CoverageSave_xml.png)

</div>

  

PyVSC can also save coverage data to a custom database format, provided the tool that implements that database implements the UCIS C API. The example below saves coverage data to a custom database using the UCIS C API implemented in the shared library named ‘libucis.so’.

<div>

[<img src="/legacy-img/CoverageSave_ucis.png" width="640" height="302" />](/legacy-img/CoverageSave_ucis.png)

</div>

  

Both of these paths to saving coverage may provide ways to bring coverage data collected by PyVSC into coverage-analysis flows implemented by commercial EDA tools. Check your tool’s documentation and/or check with your application engineer to understand which options may be available. Feel free to report what works for you on the [PyVSC discussion forum](https://github.com/fvutils/pyvsc/discussions) so that others can benefit as well.

**Viewing Coverage Data**

Obviously, you can use commercial EDA tools to view coverage data from PyVSC if your tool provides a path to bring UCIS XML in, or if it implements the UCIS C API. [PyUCIS Viewer](https://github.com/fvutils/pyucis-viewer) provides a very simple open-source graphical application for viewing coverage in UCIS XML format. 

To use PyUCIS Viewer, save coverage data in UCIS XML interchange format, then run PyUICIS Viewer on that XML file:

% pyucis-viewer cov.xml

A simple tree-based graphical viewer will open to show type and instance coverage. 

<div>

[<img src="/legacy-img/RISCV-DV_Coverage-2.png" width="640" height="516" />](/legacy-img/RISCV-DV_Coverage-2.png)

</div>

  

**Conclusion**

There are several options for viewing and manipulating coverage once it has been collected via a covergroup modeled with PyVSC. In a future post, we’ll look at some additional manipulation and reporting options being implemented within [PyUCIS](https://github.com/fvutils/pyucis). 

Until then, check out the latest additions to the [PyVSC documentation](https://fvutils.github.io/pyvsc/) and raise questions and issues on the [PyVSC GitHub](https://github.com/fvutils/pyvsc) page.

  

<div>

Copyright 2022 Matthew Ballance

</div>

<div>

<span face="Trebuchet MS, Trebuchet, Verdana, sans-serif">*The views and opinions expressed above are solely those of the author and do not represent those of my employer or any other party.*</span>

</div>
