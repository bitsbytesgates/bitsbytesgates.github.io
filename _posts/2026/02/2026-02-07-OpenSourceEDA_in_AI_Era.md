---
layout: post
title: Open Source EDA in the AI Era
date: 2026-02-07
categories: EDA
excerpt_separator: <!--more-->
mermaid: true
---

AI is changing the world in many ways. This is particularly visible in the 
commercial software-development space, where AI is often credited with 
[developing significant portions of new code](https://techcrunch.com/2025/04/29/microsoft-ceo-says-up-to-30-of-the-companys-code-was-written-by-ai/). 
But, what about the impact on open source software and, much more specifically, open source
Electronic Design Automation (EDA) software? What follows are some observations
on how open source EDA developers, users, and contributors can leverage AI based
on my own experience. In short, I see a strong potential for AI to spark a new
era of open source EDA growth and discovery if we as user, developers,
and contributors leverage it well.

<!--more-->

# EDA Software and Domain Expertise

Electronic Design Automation (EDA) software is a unique market. Like 
any other complex software, developing it requires strong software engineering 
skills. But, developing good EDA software also requires deep knowledge of the
silicon engineering domain.

In my experience with commercial EDA, these two roles are generally handled
by different people. Software engineering is handled by teams of software
developers that, thinking simplistically, need to know very little about
silicon engineering. Silicon engineering expertise is often represented 
by the product engineering role. This role is responsible for understanding
the domain, and the user's perspective on it, and translating that into
requirements that the software engineering team can implement. 
In practice, of course, each of these disciplines has some cross-over. 
EDA software engineers have varying degrees of expertise in silicon
engineering, and product engineers have varying degrees of software
engineering expertise.

# AI and Open Source EDA

An open source EDA developer typically doesn't have the luxury of focusing 
on a single domain. Open source EDA developers often start from a vision -- whether 
that's simply the existence of open source tools for a given portion of the 
silicon engineering workflow, or a vision of a new way to approach a 
part of that workflow. But, very quickly, the developer must pivot and focus
of the nuts and bolts of realizing this vision in code. 

My experience, increasingly so over the last 4-6 months, has been that 
AI allows me to focus much more energy on the Product Engineering aspects
of open source EDA, while delegating much of the software engineering 
aspects. 

# AI and Open Source EDA Developers

If you're an open source EDA developer, AI enables you to spend a greater
portion of your time in Product Engineer mode. With good requirements and
review (all key Product Engineer skills), the bulk of software engineering
tasks can be delegated to an agent. Here are a few things to consider as 
you look for AI opportunities in your project.


## Develop 'Nice to Have' Features
Being an open source developer fosters a mentality of scarcity, if your
experience is anything like mine. Ruthless prioritization is the only
way to ensure that something with sufficiently-broad application can
be produced by a single developer. 'Nice to have' features must be 
deferred -- potentially forever. 

AI nicely inverts this equation. When the primary cost of a new feature
is specification, it becomes much easier to justify adding helpful 
features: better error handling, more output formats, etc.

## More Communication
Communication tasks such as documentation, project websites, 
and project news is a task that often gets de-prioritized. After all,
we need to get key features developed!

AI-created content has come a long ways. One can argue it still has a 
ways to go, but it's often quite good for technical documentation. It 
works well in incremental mode to document features as they're developed, 
but also to improve documentation for an existing codebase. While we 
should always be cautious about passing off AI-generated 'slop' as 
useful documentation, my current experience is that AI-generated docs are
far better than no documentation at all. I'm also finding that providing
a little structure and guidance goes a long way in getting better results.

## Consider the Agent Experience
As a developer, it's key to consider how your user will experience your 
project. Increasingly, you can assume that your users will be using an 
AI agent of some form to work with your project. This means that your
project should expose usage information to make it easy for an agent 
effectively use your project.

One approach that I've found effective is to reference a `skill.md` file
for the tool from the help message. For example, here's the help output
from [DV Flow Manager](https://dv-flow.github.io), a workflow automation tool I work with.

<pre>
usage: dfm [-h] [--log-level {NONE,INFO,DEBUG}] [-D NAME=VALUE] [-P FILE_OR_JSON]
           {graph,run,show,cache,validate,context,agent,util} ...

DV Flow Manager (dfm) - A dataflow-based build system

positional arguments:
  {graph,run,show,cache,validate,context,agent,util}
    graph               Generates the graph of a task
    run                 run a flow
    show                Display and search packages, tasks, types, and tags
    cache               Cache management commands
    validate            Validate flow.yaml/flow.dv files for errors and warnings
    context             Output comprehensive project context for LLM agent consumption
    agent               Launch an AI assistant with DV Flow context
    util                Internal utility command

For LLM agents: See the skill file at: /home/mballance/.../share/skill.md
</pre>

AI agents often check a tool's help message to better-understand its operation. Including
a path to the tool's "AI Skill" file provides the agent with a pointer to more in-depth
information. 

If your project produces human-consumable output, such as reports, you should
have an option to produce JSON output as well. While JSON isn't particularly easy 
for humans to read, agents work well with its regular structure.

## Test, Test, Test
We all know that tests are good and important. But, often, we settle for a few
basic tests so we can spend more time developing new features. 

Here, again, AI can help. But, also, a good test suite is critical to getting
good results with AI. Just like a human developer, an agent makes mistakes and
a robust test suite catches those errors before they accidentally get committed.

# AI and Open Source EDA Users

As an Open Source EDA user, AI provides you tools to make better use of the 
available software. Don't hesitate to have your agent look at the source
for software that you're using. If you're trying to get a case working, 
ask it to analyze the EDA software source alongside your code and understand
what needs to change in your code.

If you hit a bug, use AI to create a reduced testcase in conjunction with
the EDA software's source. 

Now, one personal request as an open source developer: please don't just
paste the AI-generated output into an Issue and click submit. The AI-created
analysis is important, of course. Please include it in your Issue report.
But, it's likely that the AI-generated analysis is missing critical details
about your usecase and intent. Including that critical user perspective 
helps to ensure that your usecase is well-supported beyond just fixing
a point issue. 

# AI and Open Source EDA Contributors

If you're trying to move from open source EDA user to open source EDA 
contributor, welcome! AI is definitely a help here as well. 

Any complex codebase is difficult to get started with, and open source
EDA is no different. AI offers strong benefits in helping to more-rapidly
find key components of the codebase. 

A key thing to bear in mind is that LLMs are tools, not oracles. Using 
AI isn't going to magically turn you into an expert in a given project.
And, all the best practices of contributing to an open source project
still apply: ask questions, search issues, ask for feedback on 
contributions. That said, AI can bring you up to speed on a project 
far faster than you could on your own.

Set your sights a bit more broadly when it comes to reference materials.
Reading an entire standard (SystemVerilog, SystemRDL, PSS) is daunting
as a human, but easy with an agent. Use an agent to help explore 
implementation alternatives and refine requirements. 

# AI and Open Source EDA Sponsors

Sponsoring open source software development and maintenance has always been
a bit tricky -- especially for small projects. Large projects with an organization
and, often, a team of paid software developers are somewhat easy: donate
to the foundation, possibly participate in a steering committee, etc. In this case,
there is a clear link between supporting the project financially and the project
being able to scale. Smaller projects are much harder. Developers will have a 
'day job' with contract clauses prohibiting moonlighting. But, even without
this obstacle, paying the developer won't really help the project scale because
it won't lead to more people working on the project. 

While it's still early, AI suggests a new way to support small open-source projects.
AI access is typically paid by usage, coarsely denominated in Tokens. Open source
developers with an effective AI utilization strategy can easily scale a project
based on access to a larger number of tokens each month. 

If you're a would-be sponsor of Open Source EDA software, be on the lookout 
for organizations and platforms that allow you to contribute AI agent
access (LLM tokens) to your favorite projects. 

# Conclusion

AI has the potential to scale open source EDA software efforts in ways that 
other technology advances simply have not. In short, allowing us as 
open source EDA users, contributors, and developers to focus on envisioning
the workflows that we want to have, and delegating the bulk of implementation
tasks to AI assistants. This new era of open source EDA
promises new, more productive, approaches to silicon engineering challenges,
easier-to-use tools, and new funding models to help the ecosystem
scale. The future of open source EDA in the AI era is bright, and I'm 
excited to be here for this phase of the journey.


## References
- [Anthropic Skills](https://agentskills.io/home)



