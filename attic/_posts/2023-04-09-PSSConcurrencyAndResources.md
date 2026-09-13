---
layout: post
title: "PSS Concurrency and Resources"
date: 2023-04-09
categories: PSS
series: "Intro to PSS"
mermaid: true
excerpt_separator: <!--more-->
---
<p align="center">
<img src="{{ '/imgs/2023/04/DMAModelingResourcesWithPSS_splash.png' | absolute_url }}"/> 
</p>

Resource contention is a challenge that arises any time concurrency and 
shared resources (data, hardware accelerators, etc) are involved. It's one
of the big challenges, and source of bugs, in implementing code that takes
advantage of parallelism. 
When it comes to hardware resources, safe access to shared resources is 
generally managed in production by the operating system. There are two big 
reasons that using this same approach for bare-metal tests isn't a good solution:
- First, and most obvious, is that our bare-metal tests don't have an
  operating system to use in managing access to shared devices
- Second, and more interesting, is that our tests are constraint 
  guided and seek to exercise as many unique corner cases as possible.
  In contrast, the OS can focus simply on providing correct results, and
  doesn't need t be as concerned with being able to produce interesting
  and unique corner cases.

The good news, as you might guess, is that PSS provides constructs for modeling
available resources and how actions can make use of them without 
conflicts -- whether the actions are executing sequentially or 
concurrently. Let's dig in and learn more.

<!--more-->

# Resources and the DMA Example
<p align="center">
<img src="{{ '/imgs/2023/03/DMA_block_diagram.png' | absolute_url }}"/>
</p>

In the DMA example, the most obvious features that must be managed
as a resource are the channels. Channels can execute memory
transfers in parallel -- an important usecase for the IP. Eventually,
the OS driver for the DMA will manage satisfying requests for a 
DMA channel. But, for now, our test will need to manage allocating
channels itself.

# PSS Resource Management in Three Parts

There are three key parts to managing resources in PSS. 
- A data type to encapsulate data related to the resource kind
- A pool of a given resource kind that specifies the number of
  available resources
- A resource claim on an action to acquire a resource with 
  specific characteristics

## Resource Type

A _resource_ data type is declared using the `resource` keyword.
A resource type is very similar to a struct, in that it can
contain random and non-random data fields and constraints. 

A _resource_ data type has one built-in field named
`instance_id`. The `instance_id` field is a simple but effective
way to uniquely identify a resource instance. 

{% highlight pss %}
buffer MemBuf {
    rand bit[32]        size; // Size of the data
    addr_handle_t       addr_h;
}

resource Channel { }

component WbDma {
    // ...
}
{% endhighlight %}

In the case of the DMA engine, the key thing we need to know is
to which DMA channel an action is assigned. Consequently, our
resource type `Channel` doesn't contain any custom fields.


## Resource Pool

In prior posts, we've hand-waved a bit about where `buffer` pools
are placed, and how they are statically bound to actions.
Now that we have resources, we need to be a bit more mindful of 
pools, where they are placed, and how actions are bound to them.

{% highlight pss %}
component WbDma {

    pool MemBuf     mem_buf_p;
    bind mem_buf_p  *;

    pool [16] Channel    channels_p;
    bind channels_p *;
    // ...
}
{% endhighlight %}

The bind directive connects a pool to a set of actions that 
reference that `flow-object` type. In our case, we have 
placed the resource pool inside the `WbDma` component and
bound it to all actions that claim a `Channel` resource because
channels are a property of a specific DMA engine instance. Actions
running on that instance of a DMA engine IP have access to the
available channels. Actions running on a different instance have
access to a different set of channels.

Note that a `resource` pool always has a size, unlike  
`buffer` pools that are unsized. The specified size
states exactly how many resources exist in the pool.

As in previous posts, our `WbDma` component is instantiated inside the
top component in the componet tree, `pss_top`. 

{% highlight pss %}
component pss_top {
    transparent_addr_space_c<>               aspace;
    
    WbDma                                    dma;

    // ...
}
{% endhighlight %}

Let's say we add another instance of the DMA engine:

{% highlight pss %}
component pss_top {
    transparent_addr_space_c<>               aspace;
    
    WbDma                                    dma_1;
    WbDma                                    dma_2;

    // ...
}
{% endhighlight %}

Everything will work as we expect with the `resource` pool 
local to each DMA component, and resource claims on actions 
within the DMA Component bound to that local pool. When an
action runs on the `dma_1` instance, it will contend with
other actions running on that component for the
available 16 channels. Likewise, for an action running 
on the `dma_2` instance.

What would be different if we moved the resource pool up
a level?

{% highlight pss %}
component pss_top {
    transparent_addr_space_c<>               aspace;
    pool [16] Channel                        channels_p;
    bind channels_p *;
    
    WbDma                                    dma_1;
    WbDma                                    dma_2;

    // ...
}
{% endhighlight %}

Now, all actions that run on either `dma_1` or `dma_2`
contend for the same set of shared channel resources 
because all actions are bound to the same resource pool.

Doing things this way doesn't make sense for our DMA 
example, but certainly makes sense in other cases. For example,
consider a case where we have a family of algorithm 
accelerators - each with their own distinct actions - that all need to use
some shared resource such as a shared DMA engine. In that 
case, having all actions share the same resource pool would 
make sense.

## Resource Claim

Finally, we reach the point where we can have our DMA actions
claim a resource. Actions claim resources using a special 
`lock` or `share` field within the action. Much like the 
`input` and `output` fields used with buffers, declaring
a resource lock or share field causes the PSS tool to make
the field point to a resource that matches any criteria
the user has specified for the resource.

{% highlight pss %}
action Mem2Mem {
    input MemBuf            src_i;
    input MemBuf            dst_o;
    rand addr_claim_s<>     dst_claim;
    lock Channel            channel;

    // Input and output size must be the same
    constraint dst_o.size == src_i.size;
    // ...
}
{% endhighlight %}

In the case above, the only criteria the action places on the
resource is that it needs to have exclusive (lock) access to
it. No other action can use the channel at the same time.

It's also possible to use constraints to add more criteria
on selection of a resource. Take the example test below:

{% highlight pss %}
extend component pss_top {
    action TestParallelXfer {

        activity {
            parallel {
                do WbDma::Mem2Mem with instance_id == 0;
                do WbDma::Mem2Mem with instance_id == 1;
                do WbDma::Mem2Mem with instance_id < 8;
            }
        }

    }
}
{% endhighlight %}

In this case, we are very specific about which channels two of 
the three transfers should run on. Perhaps that is because we 
want to exercise some aspect of the arbitration scheme. 
For the third parallel transfer, we request a channel less than 8. 
The PSS tool will randomly select an appropriate channel, while not 
selecting channels 0 or 1.

# Locking vs Sharing a Resource
In the case of the DMA example, acquiring exclusive access to a DMA channel
(locking it) is the appropriate choice. In fact, locking resources is 
probably the most common use case. However, there are certainly valid
cases where we need to allow multiple actions to access the same resource.

The most straightforward case for shared access to a resource is when a
resource provides some useful information that can be read by multiple
actions. In this case, actions that wish to read the information should
acquire the resource as a `share(d)` resource. Actions wishing to write
the information should acquire the resource as a `lock(ed)` resource. 
Doing this will enable multiple actions to read information from the
resource-protected element, while ensuring that no action is 
simultaneously trying to change the stored information.


# Conclusion and Next Steps
In this post, we've seen how PSS enables the definition of resources
that can only be used in certain ways by certain actions over time, 
and have seen how PSS resources can be applied to describe restrictions
on how DMA channels can be used over time by concurrent behavior.

In the next post, we'll look at using PSS `registers` to connect the 
actions in our PSS model to the registers within the DMA engine.

# Resources
- [1] [DMA PSS Code (Viewing)]({{ 'code_html/2023/03/wb_dma_3.html' | absolute_url }})
- [2] [DMA PSS Code (Raw Text)]({{ 'code/2023/03/wb_dma_3.pss' | absolute_url }})
