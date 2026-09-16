---
title: 'PSS 3.1: Simplifying Composition'
date: 2026-09-15
series: PSS in the Open
categories: [PSS, Open Source EDAs]
syndicate: derived
---

<p align="center">
<img src="/imgs/2026/09/pss31_composition_banner.png" width="660" alt="PSS 3.1 composition: the same four cards -- Constraints, Composition, Target code, Target runtime -- with the Composition card highlighted and marked 'this post'"/>
</p>

A PSS description is structure, in much the same way that hardware is structural.
Even PSS activities are visualized as UML diagrams -- which have a certain
structure to them. The next category of features to look at in PSS 3.1 are features
that help to simplify the structural aspect of PSS models. These range from
incremental improvements to fairly significant changes in capability. And it's
the significant ones that are worth the most careful reading during public review,
because they change what a reusable PSS model can look like.

<!--more-->

---

# Action Initialization

PSS activities use constraints heavily. While constraints are great
for expressing rules to guide the scenario solver, sometimes we just
want to hand a sub-action a value that was never in question. Before 3.1
there was exactly one channel from an activity into a sub-action -- an
in-line `with` constraint -- and it only reaches `rand` fields. So passing
data meant expressing it as a constraint whether or not it was a
choice, and that has a consequence beyond verbosity: **constraints
operate on numbers, so anything you pass this way has to be reduced to an
address.**

That's the real cost, and it shows up in reuse. Consider an action that claims
a large block of memory and divides it up between several sub-actions. Here's
the pre-3.1 shape. `scatter_a` claims one contiguous block per direction with
`transparent_addr_claim_s`, and then has to get a quarter of each block into
each `xfer_a`.

```pss
action xfer_a {
    rand bit[64]          src, dst;   // plain addresses, no handle
    rand int in [1..4096] sz;
}

action scatter_a {
    rand addr_claim_s<> src_claim, dst_claim;

    constraint src_claim.size == 4*4096;
    constraint dst_claim.size == 4*4096;

    xfer_a x[4];

    activity {
        foreach (x[i]) {
            x[i] with {
                src == src_claim.addr + i*4096;
                dst == dst_claim.addr + i*4096;
                sz  <= 4096;
            };
        }
    }
}
```

That works, and it costs more than it looks like. The eight extra solver
variables are the visible price; the structural one is that `src_claim.addr`
appears in an arithmetic expression at all. `.addr` only exists on
`transparent_addr_claim_s`, so the claims are *forced* to be transparent --
the moment you need to subdivide a block by constraint, you've committed the
model to an address space whose absolute addresses are known at solve time.
Point `scatter_a` at an opaque space and the pattern doesn't degrade
gracefully; it simply doesn't exist. And `xfer_a` ends up holding a bare
integer, when what the address access API wants is an `addr_handle_t` -- so
every leaf action has to reconstruct a handle, or skip the API entirely.

PSS 3.1 adds exactly this capability to directly pass values to a sub-action
during activity traversal. Claim the block, then use `make_handle_from_claim`
to hand each sub-action a handle to its own slice:

```pss
action xfer_a {
    addr_handle_t         src, dst;   // inputs, not solver variables
    rand int in [1..4096] sz;
}

action scatter_a {
    rand transparent_addr_claim_s<> src_claim, dst_claim;

    constraint src_claim.size == 4*4096;
    constraint dst_claim.size == 4*4096;

    xfer_a x[4];

    activity {
        foreach (x[i]) {
            x[i] {.src = make_handle_from_claim(src_claim, i*4096),
                  .dst = make_handle_from_claim(dst_claim, i*4096)}
                with { sz <= 4096; };
        }
    }
}
```

`make_handle_from_claim(claim, offset)` returns an `addr_handle_t` whose
resolved address is the claim's address plus the offset. The important part
is its first parameter: it takes an `addr_claim_base_s`, not a
`transparent_addr_claim_s`. The subdivision is now expressed as *offsets from
a claim* rather than arithmetic on an absolute address, and an offset is
meaningful whether or not anyone knows where the claim landed. The same
`scatter_a` works over a transparent space and an opaque one, and it keeps
working when the target memory map moves. That is the flexibility argument,
and it's a stronger one than the solver-variable count: dropping eight random
variables makes this model faster, but staying off `.addr` makes it portable.

`xfer_a` also now receives the thing `write32()` and friends actually take,
which is what lets the leaf action stay agnostic in turn.

Worth knowing (11.3.1.2):

- An initializer list composes with an in-line constraint, as above. The two
  features are not alternatives: initialization sets the inputs, `with`
  constrains what remains.
- An initializer list can be attached to the action-handle *declaration*, to
  the *traversal*, or to both. When both are present, the declaration's list
  is evaluated first, then the traversal's -- so the declaration reads as a
  default and the traversal overrides it.
- Only fields accessible in `pre_solve` of the traversed action may be
  initialized, and only fields of the parent accessible in `post_solve` may
  appear on the right-hand side. That pair of rules is what makes the feature
  a data hand-off rather than a back door into the parent's solve.
- Evaluation order *within* one initializer list is unspecified, and functions
  called from an initializer expression must be side-effect free. Don't write
  a list whose result depends on the order its entries run in.
- Monitors got the same thing. A monitor traversal statement accepts an
  initializer list with the semantics of 11.3.1.2 (16.3.9).

```pss
enum mode_e { SINGLE, BURST }

action xfer_a {
    mode_e                mode;
    int                   chan;
    rand int in [1..4096] sz;
}

action seq_a {
    rand bool wide;

    // defaults applied at every traversal of this handle
    xfer_a x {.mode = SINGLE, .chan = 0};

    activity {
        if (wide) {
            x {.mode = BURST} with { sz > 1024; };  // mode=BURST, chan=0
        } else {
            x {.chan = 3};                          // mode=SINGLE, chan=3
        }
    }
}
```

---

# Action handle arrays

The companion change is smaller but it's the one you'll type most often.
Arrays of action handles may now be multi-dimensional, and an array, a
*sub-array*, or a single element may each be traversed. The leftmost dimension
is the outermost, so `x[1]` below is a sub-array of two handles.

```pss
action soak_a {
    rand int in [0..2] mode;
    xfer_a             x[3][2];

    activity {
        match (mode) {
            [0]: { x[2][0]; x[1][1]; }  // two individual elements
            [1]: x[1];                  // one sub-array of two
            [2]: x;                     // all six
        }
    }
}
```

Worth knowing (11.3.2):

- Traversing an array as a whole traverses each element independently, under
  the semantics of the *containing* scope. The same statement means six in
  sequence or six at once depending on where you put it -- which is the point,
  and also the thing to read twice.

  ```pss
  xfer_a seq[3][2];
  xfer_a par[3][2];

  activity {
      seq;                  // six, in sequence
      parallel { par; }     // six, concurrently
  }
  ```

- A whole-array or whole-sub-array traversal shall not carry an initializer
  list or an in-line constraint. If you want either, traverse the elements.
  Constrain the array from a named `constraint` block instead, where a
  `foreach` still reaches every element.

---

# Component (solve)-mutable fields

PSS components hold data, register models, pools. Up until 3.1,
none of this data was *mutable* after the component-tree initialization
phase ended. This means that actions couldn't share data via
the component tree. PSS 3.1 adds the ability for actions to
exchange data at solve time via mutable fields in the component.

The example below is a soak test that wants to know, at the end of solving,
how much traffic it generated and which channels it touched. Neither number is
a constraint on anything -- there is no single scope where a constraint could
see all of it, because each iteration of the `repeat` is its own sub-action.
It's bookkeeping, and before 3.1 there was nowhere in the model to keep it.

```pss
component chan_c {
    action xfer_a {
        rand int in [1..4096] sz;
        ref dma_c dma;

        exec post_solve {
            if (dma != null) {
                dma.record(sz, comp);
            }
        }
    }
}

component dma_c {
    chan_c ch[4];

    mutable int              bytes_moved;
    mutable list<ref chan_c> chans_used;

    solve function void record(int n, ref chan_c c) {
        bytes_moved = bytes_moved + n;
        if (!(c in chans_used)) {
            chans_used.push_back(c);
        }
    }

    action soak_a {
        rand int in [1..20] n;

        activity {
            repeat (n) {
                do chan_c::xfer_a {.dma = comp};
            }
        }

        exec pre_body {
            message(LOW, std_pkg::format("moved %d bytes over %d channels",
                comp.bytes_moved, comp.chans_used.size()));
        }
    }
}
```

Note `{.dma = comp}` -- that's action initialization from the previous section
doing the work of handing the sub-action the reference it reports through.
These two features arrived in the same release and they're better together:
`mutable` gives the component somewhere to keep score, and the initializer list
is how a sub-action finds out where that somewhere is.

Worth knowing (9.1.6):

- The boundary is *solve time*. A `mutable` field may be written from
  solve-time exec blocks and during activity solving; it shall not be written,
  directly or indirectly, from a target exec block. `mutable` is not a way to
  smuggle state from generation into execution.
- The tool must guarantee that solve-time exec blocks execute atomically, so
  the accumulate-into-a-shared-field pattern above is safe by construction.
- `mutable` propagates into aggregates. Declare a struct field `mutable` and
  every field inside it is mutable too. There's no way to make part of a
  struct writable.
- It may not be applied to a component field or to an `instance` reference
  field. Mutability of a referenced component's fields is decided by *those*
  fields' own qualifiers, not by the reference.
- On a plain (non-`instance`) reference field, `mutable` applies to the
  reference itself -- meaning the field can be re-pointed at a different
  instance during solving, which is a genuinely different capability from
  writing through it.
- The read you get depends on when your action solved relative to the writers.
  That's the sharp edge: the language guarantees no races, not a deterministic
  order. Anything you'd be upset to see change between two runs of the same
  seed does not belong in a `mutable` field.
- **`mutable` is a reserved word in 3.1.** If you have an attribute named
  `mutable` today, it stops parsing -- loudly, which is the good outcome. It
  joins `soft` and `overlap` on the 3.1 keyword list.

---

# Component References and Polymorphic Actions

PSS 3.0 added initial support for component references. In 3.0, component
references could be used like pointers from constraints and procedural
code. This made it easier to get access to shared data and shared
register models, but didn't address the other critical use of a component
instance: as a context for action traversal.

PSS 3.1 adds the ability to qualify a component reference as *instance*.
In other words, the reference behaves as if it were a component instance --
and in particular, it becomes a valid action-traversal context.

## Application 1: two unrelated components share an instance

<p align="center">
<img src="/imgs/2026/09/pss31_shared_instance.png" width="720" alt="video_gen_c and audio_gen_c each declare 'instance ref axi_vip_c port' and traverse axi_vip_c actions; two arrows labelled 'bound in init_down' converge from both clients onto a single axi_vip_c instance named vip_n declared in pss_top, while a sibling instance vip_s sits unbound and undriven"/>
</p>

Hierarchical traffic generation is the case that motivates this. You have a
set of traffic-generation components -- per-protocol, per-workload, written by
different people at different times -- and a single VIP that all of it has to
go through. Pre-3.1, the component tree forces a choice: the VIP is declared
inside exactly one place, and every client that wants to traverse VIP actions
has to live somewhere that makes that instance reachable. The declaration site
*is* the wiring.

```pss
component axi_vip_c {
    action write_a { rand bit[64] addr; rand int in [1..64] len; }
    action read_a  { rand bit[64] addr; rand int in [1..64] len; }
}

component video_gen_c {
    instance ref axi_vip_c port;

    action stream_a {
        activity {
            repeat (8) { do axi_vip_c::write_a; }
        }
    }
}

component audio_gen_c {
    instance ref axi_vip_c port;

    action stream_a {
        activity {
            repeat (4) { do axi_vip_c::read_a; }
        }
    }
}

component pss_top {
    axi_vip_c   vip_n, vip_s;
    video_gen_c video;
    audio_gen_c audio;

    exec init_down {
        video.port = vip_n;   // both clients share the north port ...
        audio.port = vip_n;   // ... and neither had to say so itself
    }

    action test {
        activity {
            parallel {
                do video_gen_c::stream_a;
                do audio_gen_c::stream_a;
            }
        }
    }
}
```

Each generator declares that it drives *an* `axi_vip_c`. Which one is decided
in `init_down`, at the level that actually knows the topology. That's the win:
it decouples clients from instances, so the same generator component drops into
a system with one VIP, four VIPs, or a VIP that lives three levels away.

Worth knowing (9.1.5.3):

- `instance` is what buys the traversal context. An unqualified `ref` is still
  useful -- you can compare it and read through it -- but `xfer_a` cannot run
  on it. 
- An `instance ref` can be a list. `instance list<ref chan_c> spares;` gives
  you a set of traversal contexts whose membership is decided at
  initialization.
- **Static pool-binding directives do not apply to instance refs.** Bind
  directives are evaluated statically, and refs are connected during the
  initialization stage. Consequently, it's illegal to apply bind directives
  to an instance component ref.
- Reference cycles are permitted when a component ref is used from procedural
  code, but shall not exist among the refs used as action-traversal contexts.
- Instance refs of address-space and executor types have the same capabilities
  as instance fields of those types -- which is what makes shared-address-space
  and shared-executor topologies expressible the same way.

## Application 2: decoupling the action interface from its implementation

<p align="center">
<img src="/imgs/2026/09/pss31_polymorphic_actions.png" width="720" alt="soak_c declares 'instance ref traffic_c port' and traverses traffic_c::burst_a; traffic_c is the interface component declaring burst_a with no body; a solid arrow binds the ref to cxl_c which overrides burst_a, while a dashed arrow shows pcie_c as the equally valid alternative; the bottom line reads 'exec init_down { soak.port = cxl; }'"/>
</p>

Many of those traffic generators are quite generic. A soak loop that issues
bursts at random addresses doesn't care whether the bursts land on CXL or PCIe
-- and, more to the point, we don't want it to have to *name* whoever
implements them. Pair an `instance ref` typed at a base component with 3.1's
`override action`, and it's easy to separate the interface and the implementation.

```pss
// The interface: what traffic looks like, with no statement of who drives it.
component traffic_c {
    action burst_a {
        rand bit[64]        addr;
        rand int in [1..64] len;
    }
}

// Two realizations.
component pcie_c : traffic_c {
    override action burst_a {
        exec body C = """
            pcie_burst({{addr}}, {{len}});
        """;
    }
}

component cxl_c : traffic_c {
    override action burst_a {
        constraint len <= 16;
        exec body C = """
            cxl_burst({{addr}}, {{len}});
        """;
    }
}

// A generic generator. It knows traffic_c, and nothing else.
component soak_c {
    instance ref traffic_c port;

    action soak_a {
        activity {
            repeat (8) { do traffic_c::burst_a; }
        }
    }
}

component pss_top {
    pcie_c pcie;
    cxl_c  cxl;
    soak_c soak;

    exec init_down {
        soak.port = cxl;   // one line decides which burst_a runs
    }

    action test {
        activity {
            do soak_c::soak_a;
        }
    }
}
```

`soak_a` traverses `traffic_c::burst_a` and gets whichever `burst_a` the bound
component actually provides -- including `cxl_c`'s extra `constraint len <= 16`,
which the generator never has to know about. Specifying the specific implementation
for traffic-generation actions is controlled with a single component-ref assignment.

Worth knowing (9.1.5.3 + 9.2.2):

- An `override action` is virtual with respect to the component it's declared
  in; the implementation is chosen by the component context the action is
  traversed in. An overriding action implicitly inherits from the action it
  overrides.
- A ref typed at a base component and bound to a derived instance is a valid
  traversal context for the derived component's *additional* actions too, not
  just the inherited ones (LRM Example 53). The reference's declared type sets
  a floor, not a ceiling.
- `override action` requires a same-named action in a base component, and once
  a component declares one, every subtype declaring that name must also mark it
  `override`. Template actions can't be overridden.
- Note that this is a *different* mechanism from 3.0's `override { type ... }`
  blocks. Those replace a declared type wholesale; `override action` resolves
  per component instance. Both are still in 3.1 and they compose.
- Null is a real state. A traversal context must be non-null, so an unbound
  `instance ref` is a scenario that can't elaborate. Decide deliberately
  whether an unbound port means "not present" or "integration bug", and check
  for it where you can produce a better message than the tool will.

---

# Conclusions and providing feedback

Composition may seem like the least interesting of the four PSS 3.1
feature groups, but it actually adds significant new modeling and
reuse capabilities. Action initialization and
action-handle arrays make activities read like what they are. `mutable` gives
a component somewhere to keep activity-model state. And instance
component references break the link between where a component is declared and
who is allowed to traverse its actions -- which is the difference between a
model you ship and a model somebody else extends.

Here's what I'd suggest thinking about while reading Clause 9 and Clause 11 of
the draft:

- **Take the component you'd most like to reuse and try to re-express its
  wiring with `instance ref`.** Does the behavior partition the way you want?
  What about the restriction on static binding? Are there scenarios where 
  that creates a problem?
- **Where does `mutable` need ordering guarantees it doesn't have?** Atomicity
  without a defined solve order is enough for accumulators and not much else.
  If you have a use case that needs more, describe it concretely; it's the kind
  of input that shapes the next release.
- **Try initializing something the rules don't allow.** The `pre_solve` /
  `post_solve` accessibility pair in 11.3.1.2 is deliberately narrow.
  Find the case where you want to pass data and cannot.
- **Check the boundaries of whole-array traversal.** 11.3.2 forbids an
  initializer list or in-line constraint on an array traversal. Does that leave
  you a workable way to express what you wanted?

  
  It takes a community to build a standard, and your eyes and attention are a
  much-appreciated contribution! The review closes at the end of September.

## References

- [Feedback Forum](https://forums.accellera.org/forum/64-portable-stimulus-31-public-review-feedback/)
- [PSS 3.1 Draft](https://www.accellera.org/images/downloads/drafts-review/PSS%203.1%20Public%20Review%20Draft%202026.08.28.pdf)
- [Post 1: PSS 3.1 Is Out for Public Review](https://bitsbytesgates.com/blog/PSS3.1_PR_01_Overview/)
- [Post 2: Simplifying Constraint Modeling](https://bitsbytesgates.com/blog/PSS3.1_PR_02_Constraints/)
