---
title: Why Not an IDE?
date: '2018-09-02T18:55:00.003-07:00'
tags:
- IDE
- DVKit
- Integrated Development Environment
- SystemVerilog
- Eclipse
- SVEditor
legacy: true
author: Matthew Ballance
blogger_id: tag:blogger.com,1999:blog-142675602739945566.post-5500393587446281673
blogger_orig_url: https://bitsbytesgates.blogspot.com/2018/09/why-not-ide.html
modified_time: '2018-09-02T19:00:20.341-07:00'
syndicate: none
---

As anyone (technical) who knows me can attest, I'm a big fan of Integrated Development Environments (IDEs). I've personally focused particularly on the [Eclipse](http://eclipse.org/) IDE, but I'm more generally a fan of the concept -- the notion that the task of developing code is different from the task of typing arbitrary text, and that programmers should be able to take advantage of these differences.  
  
IDEs provide the ability to navigate large codebases with ease (and without grep), to productively leverage other's code without first committing it to memory, and to catch typing mistakes before running off to run a project build. And with an extensible IDE framework like Eclipse (and [VSCode](https://code.visualstudio.com/), for that matter), a programmer can get these benefits when working with a wide variety of languages -- C++, Java, SystemVerilog, Python, and more.  
  
Recently, however, I've been puzzling over why more people **don't** use an IDE. What are the factors the hold them back? And, knowing this, what would enable them to get the benefits of an IDE?  
  
Some of the reasons cited for not using an IDE are hard to counter. For example (with slight exaggeration): "I memorize all the code I work with, and don't make mistakes, so an IDE doesn't really provide me any value".  
  
Other reasons hint at the startup efforts required, and the differences in use model. "I couldn't get my project properly configured for the IDE, and gave up after a couple of weeks". "I understand the benefits of an IDE, but my fingers just automatically launch Vi when I want to edit a file. Starting up the IDE seems to take so long!"  
  
I'm particularly interested in this second category of reasons, since I suspect something can be done about these reasons for not getting the benefits of an IDE. I'm actually thinking about somewhat of a hybrid -- a simple editor launched from the shell that brings a fair number of the benefits delivered by a full integrated development environment.  
  
What do you think? What are the reasons you've heard for not using an IDE? If you don't use an IDE, what are your reasons?
