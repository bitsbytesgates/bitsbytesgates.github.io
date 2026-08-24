---
title: Tools and Techniques to Improve YAML-File Usability
date: '2022-06-26T17:31:00.002-07:00'
tags:
- Python
- YAML
- JSON
- Schema
legacy: true
author: Matthew Ballance
blogger_id: tag:blogger.com,1999:blog-142675602739945566.post-6866712509128303273
blogger_orig_url: https://bitsbytesgates.blogspot.com/2022/06/tools-and-techniques-to-improve-yaml.html
modified_time: '2022-06-26T17:31:26.507-07:00'
image: https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjeUm4wAbSaE2GiFPDoa1M_6U6OqGwT5jusXQtor0CaVBSy_OYi1JCUko102SmcL0MBhnNOpBpQznLycMXV4T3OyDLnYaicBSEAyTMzPIyjswUegXQPOutmCFliEKg3Njs3gollZawm6YiJq1Q2fb2APy3gJlnwSgON-q__3hMqnytgYdhA_1YWKHuGZg/s72-c/splash.png
syndicate: none
---

<div>

[![](/legacy-img/splash-19.png)](/legacy-img/splash-19.png)

</div>

  

This blog post is a bit of a departure from many that I’ve created for this blog. Most of my blog posts are about things I’ve created. This post is about a collection of tools that I use in developing the things I create.  

I’ve recently come back to working on some new features in PyUCIS, the Python library for accessing functional coverage data. PyUCIS provides an implementation of the Accellera UCIS, and several back-end implementations. Good tests are critical when developing new functionality and, in the case of PyUCIS, tests rely on having coverage data to manipulate. As it so happens, while the UCIS API is good for providing tools access to coverage data, it’s not a great interface for humans (and, specifically, for test writers). What test writers need is a very concise and easy-to-read mechanism to capture the coverage data on which the library should operate. How should we capture this data? A couple decades ago, I might have toyed with developing a small language grammar to capture exactly the data I needed. Today, using a mark-up language like YAML or JSON to capture such data is my go-to approach.

**YAML - A Data Format for Everything and Nothing**

There are many reasons for the popularity of YAML for capturing application-configuration information, such as what we need to capture coverage data. YAML’s structure of a nested series of mappings and lists lends itself to easily capturing all manner of data. Furthermore, support for reading and writing YAML is available the vast majority of programming languages. 

However, the ease with which we can define new data formats, and create simple processors to accept data captured in these formats can be deceptive. It’s tempting to think that, because YAML defines a standard set of structures for capturing data, users will find it easy and intuitive to capture data in our specific format. It’s tempting to think that our format might be so simple that only a little documentation with a few examples may be more than sufficient. The truth, however, is that making our application-specific data format usable requires us to do many of the same things that we would have to do if we defined a custom language. Our YAML-based format must be fully-documented, our data processors must be robust in accepting valid content, rejecting invalid content, and not silently ignore unrecognized input. I’ve had the painful experience of coming back to a project (yep, one that I created) after a few months away and having to dig into the YAML-processing code to remember the data format. 

The apparent ease with which we can access data from our application code is also a bit deceptive. Most YAML-reading libraries provide access to the data through a hierarchy of maps and list that mirrors the structure of the data. Depending on how we might want to subsequently process the data, we might first copy it to a set of custom data object, or we might access it by directly querying the maps and lists. In both cases,  

The really thing about YAML, though, is that many tools exist precisely to help make a custom YAML-based format easy to use and reliable to implement. For the most part, I will focus on tools available in the Python ecosystem. However, many of these tools are equally-useful in when implementing applications in other languages. YAML-processing libraries exist in other language ecosystems as well.

**PyUCIS Coverage Example**

Let’s look at the following tools in the context of the YAML data format that PyUCIS uses to capture coverage data for testing. Here’s a small example:

<div>

[![](/legacy-img/coverage_yaml.png)](/legacy-img/coverage_yaml.png)

</div>

<div>

The root of data in the document is named ‘coverage’. Currently, ‘coverage’ consists of a series of covergroup types under the ‘covergroups’ section. Each covergroup type has a name and a list of instances. A covergroup instance holds coverpoints, which have bins in which hit counts are stored. The format is intended to make it very simple to capture coverage data for use in testing coverage reporting and merging tools. It’s also not a bad format to bring in coverage data from other tools.

</div>

<div>

**PyYAML**

</div>

<div>

<div>

It’s incredibly simple to read data from a YAML-formatted file. I’ve tended to use the PyYAML Python library, but there are many other choices. With PyYAML, reading in file like the example above is incredibly simple:

</div>

<div>

import yaml

</div>

<div>

  

</div>

<div>

with open(“coverage.yaml”, “r”) as fp:

</div>

<div>

yaml_data = yaml.load(fp, Loader=yaml.FullLoader)

</div>

<div>

The result is a hierarchy of Python dictionaries and lists containing the data from the file, which we can walk by indexing. For example:

</div>

<div>

for cg in yaml_data\[“coverage”\]\[“covergroups”\]:

</div>

<div>

  print(“Covergroup type: %s” % cg\[“name”\])

</div>

</div>

**JSON Schema**

<div>

**  
**

<div>

<div>

One thing we will always want to ensure is that a coverage file conforms to the required syntax. One way to do this is to hand-code a validator that walks through the data structure from the parser and confirms that required elements are present and unexpected elements are not. Another is to create a schema for the document and use a validation library. 

</div>

<div>

We will create a schema for the coverage file format. Creating a schema is the most efficient way to enable validation of our file format. In addition, once we have a schema, there are many other ways that we can use it.

</div>

<div>

Despite the fact that we are using YAML for our data, we will capture the schema using json-schema.

</div>

<div>

[<img src="/legacy-img/schema_ex.png" width="640" height="549" />](/legacy-img/schema_ex.png)

</div>

  

The example above is the first part of the schema for our coverage data. It’s a bit verbose, but notice a few things:

- The root of our document is an object (a dictionary with keys and values) with a single root element coverage
- A coverage section is an array of covergroupType. Note that the schema refers to this separate declaration, which allows it to be referenced and reused in multiple locations.
- covergroupType  specifies that it is an object that has three possible sub-entries (name, weight, instances)
- Of these possible sub-entries, only ‘name’ is required

This merely scratches the surface of what is possible to describe with json-schema. There’s a bit of a learning curve, but my experience has been that it’s pretty straightforward once you learn a few fundamentals.

Once we have a schema, we can validate the data-structure returned from the YAML parser against the schema using the jsonschema Python library.

import yaml

import json

import jsonschema

  

with open(“coverage.yaml”, “r”) as fp:

yaml_data = yaml.load(fp, Loader=yaml.FullLoader)

with open(“coverage_schema.json”, “r”) as fp:

     schema = json.load(fp)

jsonschema.validate(instance=yaml_data, schema=schema)

  

Validating a document prior to attempting to process the data structure from the YAML parser allows us to simplify our processing code because we can assuming that the structure of the data is correct.

**Python-JsonSchema-Objects**

The simplest way to obtain data is to operate directly on the data structure returned by the parser. 

While  this is simple and straightforward, there is at least one significant pitfall: it’s almost never a good idea to use string literals. Consider what happens if we change the name of one of our optional keywords just a bit. 

weight=1

if “weight” in cg.keys():

  weight = cg\[“weight”\]

If we neglect to update all the locations in our code that use this string literal, some of our data will simply be silently ignored. Clearly, there are some incremental steps we can take – for example, defining a constant for each string literal, making it easier to update. 

Another approach is to work with classes that are generated from our schema. This approach makes it much more likely that we’ll find data misuse issues earlier, and has the added benefit of giving us actual classes to work with. I recently discovered the python-jsonschema-objects project, and used it on PyUCIS for the first time. Thus far, I’m extremely impressed and plan to use it more broadly.

The short version of how it works is as follows. python-jsonschema-objects works off of a JSON-schema document. Each section of the schema (eg covergroupType) should be given a title from which the class name will be derived. Call python-schema-objects to build a Python namespace containing class declarations. Your code can then create classes and populate them – either directly or from parsed data.

It looks like this:

import python_jsonscehma_objects as pjs

  

builder = pjs.ObjectBuilder(schema)

ns = builder.build_classes()

cov = ns.CoverageData().from_json(json.dumps(yaml_data))

  

if cov.covergroups is not None:

  for cg in cov.covergroups:

    print(“cg: %s” % cg.name)

  

The ‘ns’ object above contains the classes derived from the definitions in the schema. We can create an instance of a CoverageData class that contains our schema-compliant data just by loading the JSON representation of that YAML data. From there on, we can directly access our data as class fields.

**VSCode YAML Editor**

Thus far, we’ve primarily looked at tools that help the developer. The final two tools are focused on improving the user experience. Both leverage our document schema.

Visual Studio Code (VSCode) is a free integrated development environment (IDE) produced by Microsoft. In open source terms, it’s free as in beer. My understanding is that there are compatible truly open source versions as well. As with many IDEs, there is an extensive ecosystem of plug-ins available  to assist in developing different types of code. One of those plug-ins supports YAML development.

So, what does having a schema allow an intelligent editor to do for us? Well, for one thing, it can check the validity of a YAML file as we type it and allow us to fix errors as we go. 

<div>

[![](/legacy-img/vscode_autocomplete.png)](/legacy-img/vscode_autocomplete.png)

</div>

  

It can suggest what content is valid based on where we are in the document. For example, the schema states that we can have coverpoints and crosses elements inside an instances section. The editor knows this, and prompts us with what it knows is valid.

<div>

[![](/legacy-img/vscode_hover.png)](/legacy-img/vscode_hover.png)

</div>

<div>

It can also shows us information about the document section we’re hovering over. Features like these can significantly improve ease of use, making it easier for your users to get started. 

</div>

**Sphinx Json Schema**

</div>

<div>

<div>

Over time, I’ve really come to love Sphinx-Doc for documenting projects. I really like the way it enables combining human-created content with content extracted from the implementation code. I think it finds a great middle ground between tools that fully-generate documentation from code comments and documentation that is fully human created.

</div>

<div>

Not surprisingly, Sphinx has an extension that supports extracting data from a JSON schema. The extracted data provides a great synopsis of the data format. It’s very likely that you’ll want to add in a bit of extra description on top of what makes sense to put directly in the schema documentation.

</div>

<div>

[<img src="/legacy-img/sphinx-doc.png" width="640" height="446" />](/legacy-img/sphinx-doc.png)

</div>

  

<div>

The heading and table above are the result of using sphinx-jsonschema to document the covergroupType entity in our coverage schema. All the sub-elements are documented, and complex sub-elements have links to the relevant documentation. The text below the table is description that was manually added to the document. As with most Sphinx plug-ins, the jsonschema plug-in saves the developer from the laborious work of documenting the structure of the document.

</div>

<div>

**Conclusion**

</div>

<div>

YAML is an excellent textual format structure for capturing structured data in a human readable way. Making use of a few readily-available free and open-source tools can make domain-specific YAML-based file formats much easier and reliable to implement, and can dramatically increase their usability. Next time you start sketching out a YAML-file format to use in your application, I’d encourage you to also reach for some of these tools. Your users will thank you – even if the sole user ends up being you!

</div>

<div>

***References***

</div>

<div>

<div>

**    •** PyUCIS GitHub - https://github.com/fvutils/pyucis

</div>

<div>

    • PyUCIS Docs - https://fvutils.github.io/pyucis/

</div>

<div>

    • json-schema - https://json-schema.org/

</div>

<div>

    • jsonschema Python library - https://pypi.org/project/jsonschema/

</div>

<div>

    • RedHat YAML editor for VSCode - https://github.com/redhat-developer/vscode-yaml

</div>

<div>

    • sphinx-jsonschema - https://sphinx-jsonschema.readthedocs.io/en/latest/

</div>

<div>

<div>

Copyright 2022 Matthew Ballance

</div>

<div>

<span face="Trebuchet MS, Trebuchet, Verdana, sans-serif">*The views and opinions expressed above are solely those of the author and do not represent those of my employer or any other party.*</span>

</div>

</div>

</div>

  

  

  

</div>

</div>
