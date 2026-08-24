---
title: 'PyUCIS: Manipulating Coverage Data'
date: '2022-07-17T13:37:00.000-07:00'
tags:
- functional coverage
- Python
- Altera
- UCIS
- Accellera
legacy: true
author: Matthew Ballance
blogger_id: tag:blogger.com,1999:blog-142675602739945566.post-4728958066307117361
blogger_orig_url: https://bitsbytesgates.blogspot.com/2022/07/pyucis-manipulating-coverage-data.html
modified_time: '2022-07-17T13:37:35.605-07:00'
image: https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhp1-_7rtBzwcTNYBtGBUsqaxugtgc8RIz3D1KHRhbTpqghM-oTZjXq_6-ngByPlwmSHZgnu6f5e8ptq6wLa5EZFkOuOHWmgYY0JLua-wLrlTw38FcWT_hMZuFzwOEnxYv1oEimFAAqnr4bcDEo2meEFEZQvH7YdDXMGUixfLzHC6KGfQ_iuXOgn48ogg/s72-c/splash.png
syndicate: none
---

[![](/legacy-img/splash-17.png)](https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhp1-_7rtBzwcTNYBtGBUsqaxugtgc8RIz3D1KHRhbTpqghM-oTZjXq_6-ngByPlwmSHZgnu6f5e8ptq6wLa5EZFkOuOHWmgYY0JLua-wLrlTw38FcWT_hMZuFzwOEnxYv1oEimFAAqnr4bcDEo2meEFEZQvH7YdDXMGUixfLzHC6KGfQ_iuXOgn48ogg/s540/splash.png)  
  

In a prior post, we looked at how to inspect coverage as a text report and export coverage data using the PyVSC API, and view coverage graphically using the PyUCIS-Viewer. Recent enhancements have enabled the PyUCIS library to provide even more ways to manipulate coverage data. Over the next couple of posts, we’ll look at those enhancements. 

**New ‘ucis’ Command**

PyUCIS is a library for working with the Accellera UCIS data model. It started as a library for other applications and libraries, such as PyVSC and the PyUCIS Viewer, to use to read and write data using the UCIS data model. Recent enhancements have added standalone functionality which can meaningfully be accessed from the command line. 

You can find documentation for the ucis command and sub-commands in the [PyUCIS documentation](https://pyucis.readthedocs.io/en/latest/commands.html). Fundamentally, there are four key operations:

- Convert coverage data from one format to another
- Merge coverage data from multiple databases into a single database
- Produce coverage reports in various formats
- Obtain information about available coverage data and report formats

These commands are just a starting point. They will be enhanced over time, and more commands may be added as well. If you have suggestions for new commands and/or new capabilities for existing commands, feel free to add an enhancement request on the [PyUCIS GitHub page](https://github.com/fvutils/pyucis/issues).

**Plug-in Framework**

PyUCIS has added a plug-in framework with support for database formats and report formats. The goal is to make commands operating on coverage data extensible extensible from the beginning, as well as to enable the set of supported coverage-data formats and report formats to be easily extended without changing PyUCIS.  I’ll devote a future post to the plug-in framework. For now, the ucis command supports listing the available coverage-data and report plug-ins. For example:

% ucis list-db-formats

libucis - Reads coverage data via an implementation of the UCIS C API

xml     - Supports reading and writing UCIS XML interchange

yaml    - Reads coverage data from a YAML file

  

**New Input Format**

One often-requested PyUCIS feature is the ability to merge coverage data from several input coverage databases into a single resulting coverage database. One of the first challenges I faced in implementing this functionality was how to write tests. The UCIS API is written with applications in mind. I’ve found it to be a pretty-verbose API when it comes to writing tests. Consequently, tests written directly in terms of the API aren’t particularly easy to follow from a code perspective.

I decided to define a YAML format to make it simpler to capture coverage data in an easy-to -read way. Initially, this was just for testing. However, it may also be a useful interchange format that is less verbose and complex (also, quite possibly, more simplistic) that the XML interchange format defined by the UCIS standard.

<div>

[<img src="/legacy-img/yaml_coverage_spec.png" width="250" height="237" />](https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjdaeXpmEYuvyXmWxluRALy-WLMci6JOtkxwHv8pizdR3AZyMLLDcKkbEzSkaj6fT7b9U4yxc06CLKMX1xy6Cc_VM2Ntgk0A7ri3epneWGF8BKVgzafT4-ks3BwSeZVIqKeUZFdxnVAc9AIiIC9gS75isWG5JSdGHqlobAPQSLcodmUBOHPA0lTrC6n9Q/s250/yaml_coverage_spec.png)

</div>

<div>

A simple coverage specification is shown above. This coverage data describes a covergroup type (my_cvg) with a single instance (i1). A single coverpoint (cp1) has two bins (b1, b2) of which one has a single hit and one has no hits. While this coverage specification was created to make setting of test coverage data simpler for a human, I believe it may also be useful as a simple coverage-interchange format. If you find it useful, please let the community know via the [Discussion forum](https://github.com/fvutils/pyucis/discussions) on the PyUCIS GitHub page.

</div>

<div>

You can find more details on the [YAML Coverage Data Format reference documentation](https://pyucis.readthedocs.io/en/latest/reference/yaml_coverage.html) page. 

</div>

**Merging Coverage Data**

One consistently-requested feature for PyUCIS is the ability to merge multiple databases into a single unified coverage database. PyUCIS now supports basic merge functionality. Currently, PyUCIS performs a union merge where all unique coverage features found in all the input databases are propagated to the output database. I anticipate that more merge algorithms will need to be added over time, but hopefully this is a good start.

  

Let’s take a look at a very simple case. Let’s say we have two coverage-data sets shown below:

<div>

[![](/legacy-img/merge_input_data.png)](https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEg6vvu8qYu9EklhJd0IkaC4_Px0ZcCjPQZbFy1-TtgNviArsSrtHc-PN7rSRYJE2XpUo4uTHQ7YaBTY3D8_VcOjL3EuOsvVRKlwTvAQA6H9LRVLyL0bAtZdBSi3Wv51MQR4PzCk2WQj-EckBSwdhhcVylHWirWl36g7amzFFmC9jah_wc1YLYMtZmL9uA/s504/merge_input_data.png)

</div>

  

The structure of these two coverage databases is the same (same covergroup type, instance, and coverpoint). Each coverage database has 50% coverage. Let’s merge these two databases and report the coverage.

% ucis merge -if yaml -o merge.xml coverage_1.ycdb coverage_2.ycdb

We specify the two input databases, as well as their format (yaml). We specify the output database as merge.xml.

The resulting coverage report on the merged database will report 100% coverage, as expected:

% ucis report merge.xml

TYPE i1 : 100.000000%

    CVP cp1 : 100.000000%

**Reporting Coverage Data**

Reporting is a key activity when working with coverage data. We’ve looked at the ability to browse coverage data graphically using the PyUCIS-Viewer, but getting a textual report is every bit as important. In addition to presenting information concisely, textual reports can be processed programmatically to extract key pieces of data. 

We can list the currently-available report plugins using the ucis command:

% ucis list-rpt-formats

json - Produces a machine-readable JSON coverage report

txt  - Produces a human-readable textual coverage report

  

The default report is textual. Let’s create a textual report on the YAML coverage-data above:

% ucis report -if yaml coverage.ycdb 

<div>

[<img src="/legacy-img/txt_coverage_report.png" width="244" height="85" />](https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEifRBJaI9kmG0at2fuySwAQRHqOrow3uiP17zEjyQmj0dU-N0z3ZJNIuxebRKzImTChJgFqOt1GvsbhS967pQ1gR42WDsn5QPTlcLx3WsuTlhF8oTs6bpQZAUlFdUrda7VrP9CJJ2hBxGzeReERNEC9fnSc_b2P0A79M4AQx-kIl2MgdAEEywcZmgVFBw/s244/txt_coverage_report.png)

</div>

  

Note that we need to specify the format of the input data (yaml). The result is a simple human-readable report of the coverage data in the database.

What if we wanted to post-process the data using a script? We certainly could extract what we need by parsing the output above, but working with data in a machine-readable format is often much simpler. Let’s report our data in JSON format:

% ucis report -if yaml -of json coverage.ycdb 

<div>

[![](/legacy-img/json_coverage_report.png)](https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEi1LqtUHblxEwKju_-m9tESy3trKWjJi_-y-NkYK73HhoU-Etm9xdqIwqzkS7E_ASMnNmu86N6dYm2GfSb8-WeHZdspBEWi3oM4CLmnnLr_Fjok8prBX5rg0r3ip4QQ7Z8H0meu74yU3PbLxcuPHw41KAx42h2pHHpeClfVe4O6TJyMrEgWX4eiDrNxtg/s862/json_coverage_report.png)

</div>

<div>

Obviously, the data is less compact and more verbose. But, reading this into a Python script for further post-processing is incredibly simple! If you’re interested in the JSON report format, have a look at the schema documentation \<https://pyucis.readthedocs.io/en/latest/reference/coverage_report_json.html\>.

</div>

<div>

So, for now, PyUCIS supports two textual report formats, and would benefit from more report formats. For example, a plain HTML report and a fancy interactive web-based report. If someone in the community has the skills and is interested, the project would definitely be interested!

</div>

**Next Steps**

PyUCIS continues to evolve, adding a more more hopefully-useful features at a time. Stay tuned for a future post on the plug-in interface, and the addition of more coverage-database and report formats. 

  

<div>

Copyright 2022 Matthew Ballance

</div>

<div>

<span face="Trebuchet MS, Trebuchet, Verdana, sans-serif">*The views and opinions expressed above are solely those of the author and do not represent those of my employer or any other party.*</span>

</div>
