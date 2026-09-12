---
title: 'PSS 3.1: Simplifying Constraint Modeling'
date: 2026-09-12
series: PSS in the Open
categories: [PSS, Open Source EDAs]
syndicate: derived
---

<p align="center">
<img src="/imgs/2026/09/pss31_constraints_banner.png" width="660" alt="PSS 3.1 constraints: the same four cards -- Constraints, Composition, Target code, Target runtime -- with the Constraints card highlighted and marked 'this post'"/>
</p>

PSS language constructs fall into two main categories: declarative and procedural.
When you see 'declarative', think 'rules' and 'constraints'. A declarative 
description is captured in terms of boundaries and relationships that must 
hold for the description to be valid. Doing so gives tools the opportunity to 
select specific values and scenarios from within the 'valid' space -- whether
randomly or otherwise. 
PSS 3.1 adds several new capabilities to make constraint descriptions more
compact, readable, and rich. These are exactly the types of features to review
carefully in a public-review draft!

`<!--more-->`

---

# Making constraints reusable

Constraints are common in many verification languages, and PSS is no exception.
Generally constraints are collected in groups -- typically named. But, the
individual statements with a constraint block are not named, and are not reusable
except by cut/paste.

```pss
struct xfer_s {
    rand bit[64] src_addr, dst_addr;
    rand int     access_sz;

    constraint c {
        access_sz in [1,2,4,8];
        src_addr % access_sz == 0;
        dst_addr % access_sz == 0;
    }
}
```

The alignment relationship above is a great case in point. We can recognize
that using mod and equality establish an alignment relationship, but there's
nothing in the constraint to highlight this unless we add a comment. Also, 
we have to reiterate the same expression every time we want to require an 
alignment relationship.

```pss
struct xfer_s {
    rand bit[64] src_addr, dst_addr;
    rand int     access_sz;

    constraint aligned(bit[64] a, int n) { a % n == 0; }

    constraint c {
        access_sz in [1,2,4,8];
        aligned(src_addr, access_sz);
        aligned(dst_addr, access_sz);
    }
}
```

PSS 3.1 introduces "generic constraints" -- constraint relationships that
are named and parameterized. This name attaches semantic meaning to the
relationship: I can see that the author's intent has something to do with
alignment without understanding that actual expression. 

Generic constraints can be declared across the PSS description depending
on intent. Constraints declared in global scope, such as package scope,
are static and can only reference their parameters and static constants. 
Generic constraints declared in struct and action context can access 
fields of the containing type, and can be overridden via inheritance 
much like functions can be.

## Constraints that yield a value

The alignment constraint is a `boolean` constraint. The expression must 
evaluate to `true` in order for the constraint set to be valid. 

```pss
constraint numeric max(numeric a, numeric b) (a < b) ? b : a;

struct S {
    rand bit[8] j, k, l;
    // Equivalent to: j == (k < l) ? l : k;
    constraint j == max(k, l);
}
```

But, it's also very useful to reuse individual expressions that result 
in a value. The `max` generic constraint above selects the maximum
value from the specified inputs and yields it. 

Generic constraints can be declared with concrete types such as `int`.
But, there are cases where that is limiting. Consider `max`. We might
want to apply the same logic to floating-point and integer types. The
`numeric` type acts as a flexible type that covers both integer
and floating-point types, allowing generic constraints to be even more
"generic". 

## What about Dynamic constraints?

You might be thinking that generic constraints sound similar to a 
feature PSS already has: dynamic constraints. Deciding how to approach
overlaps like this is a task that any growing language needs to tackle.

```pss
// PSS 3.0 spelling -- deprecated in 3.1
dynamic constraint dyn_addr1_c { addr in [0..0xFF]; }
// PSS 3.1 spelling -- a generic constraint with no parameters
constraint gen_addr1_c() { addr in [0..0xFF]; }
```

In the case of dynamic constraints, the PSWG decided to deprecate dynamic
constraints and replace them with generic constraints since generic constraints
are a strict superset of dynamic constraints. The code snippet above
shows how code should be updated to replace existing dynamic constraints with
generic constraints.

---

# Soft constraints: prioritized defaults

PSS 3.1 adds support for `soft` constraints. This is both a critical capability
to have, and one to use with extreme care. SystemVerilog has long had support
for soft constraints. The LRM dedicates a significant section dedicated to elaborating
the priority scheme governing which constraint is disabled in the case of a
conflict. In SystemVerilog, `soft` is the only available tool to set a default
value for a random variable and later alter that default. PSS supports two
mechanisms, `default` and `soft` constraints, that have different feature and
cost trade-offs. 

```pss
package dma_lib_pkg {
    struct xfer_s {
        rand bit[64] src_addr, dst_addr;
        rand int     access_sz;
        rand bit[32] total_sz;

        constraint legal_sizes {
            access_sz in [1,2,4,8];
            total_sz % access_sz == 0;
        }

        constraint house_style {
            default access_sz == 4;
            soft total_sz in [64..4096];
        }
    }

    abstract action A {
        rand bool is_large;
        rand xfer_s;

        constraint default xfer_s.access_sz == 2;
        constraint (is_large) -> xfer_s.total_sz > 4096;
    }
}
```

In short, `default` constraints are the best option when variables have 
a single default value that either always applies or always does not 
apply. `access_sz` is a case in point. We want a single default value, 
not a range. And, when executing transfers, we unconditionally change
it -- either disabling the default completely or setting a new default.

`total_sz` is a bit different. We want to use a default range. And,
we might want to conditionally change it based on randomly-selected
values. This is where `soft` really shines.

Solving `soft` constraints is complex, so it's generally still best
to use `default` constraints whenever possible. But, PSS now supports
`soft` constraints for when they're really needed.


---

## Using array slices in constraints

```pss
struct desc_list_s {
    rand bit[32] chan[8];
    rand bit[32] active;

    constraint distinct_low_channels {
        unique chan[0..3];
        active in chan[0..3];
    }
}
```

PSS 3.1 also adds support for applying `unique` and `in` constraints to 
slices of arrays. Previously, we would have needed to manually unroll 
the `in` constraint(eg active == chan[0] || active == chan[1] || ...) and
create a nested `foreach` constraint to ensure uniqueness. Now, these
relationships are expressed succinctly.

# Conclusions and providing feedback

Constraints are central to a PSS scenario model, and PSS 3.1 adds several 
new features to help make constraint descriptions easier to express. 

I have two types of LRM public review feedback to suggest (and request) based 
on this post. The first, and most important, is the qualitative type: how 
do these new constraint constructs impact the PSS models you can create? Do they help 
you write more-compact, easier-to-maintain constraints? But, most importantly:
where are the corner cases? What enhancements should the working group consider
going forward to build on these features? While those enhancements won't make
it into 3.1, that feedback is critical in shaping forward-looking priorities.
The second is a request for extra eyes on the document. While updating the 
open source PSS parser to support 3.1, I realized that the 'soft' keyword wasn't
listed in the keyword table. It's exactly this type of small oversight that many
sets of independent eyes help to catch!

## References

- [Feedback Forum](https://forums.accellera.org/forum/64-portable-stimulus-31-public-review-feedback/)
- [PSS 3.1 Draft](https://www.accellera.org/images/downloads/drafts-review/PSS%203.1%20Public%20Review%20Draft%202026.08.28.pdf)
- [Post 1: PSS 3.1 Is Out for Public Review](https://bitsbytesgates.com/blog/PSS3.1_PR_01_Overview/)

