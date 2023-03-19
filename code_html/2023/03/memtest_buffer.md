---
layout: code
---
```pss
/****************************************************************************
 * memtest_buffer.pss
 *
 * Copyright 2023 Matthew Ballance and Contributors
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may 
 * not use this file except in compliance with the License.  
 * You may obtain a copy of the License at:
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software 
 * distributed under the License is distributed on an "AS IS" BASIS, 
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  
 * See the License for the specific language governing permissions and 
 * limitations under the License.
 *
 * Created on:
 *     Author: 
 ****************************************************************************/
import addr_reg_pkg::*;
import executor_pkg::*;

struct core_s : executor_trait_s {
    rand bit[8]     id;
}

buffer mem_b {
    rand bit[64] in [0..0xFFFFFF] offset;
    rand bit[32] in [1..256]      words;
}

component memtest_c {
    addr_handle_t       base_addr;

    // Binding the mem_b pool to all actions enables
    // all actions to communicate via mem_b objects
    pool mem_b mem_b_p;
    bind mem_b_p *;

    action Write {
        output mem_b                  dat_o;
        rand executor_claim_s<core_s> core;

        exec body {
            repeat (i : dat_o.words) {
                write32(
                    make_handle_from_handle(
                        comp.base_addr, 4*(dat_o.offset+i)),
                    i+1);
            }
        }
    }

    action Copy {
        input mem_b                     dat_i;
        output mem_b                    dat_o;
        rand executor_claim_s<core_s>   core;

        // Ensure we copy the same number of words
        constraint dat_i.words == dat_o.words;

        // Ensure that src/dst regions d not overlap
        constraint (dat_i.offset+(5*dat_i.words) < dat_o.offset) ||
            (dat_i.offset > dat_o.offset+(4*dat_i.words));

        exec body {
            bit[32] tmp;
            repeat (i : dat_o.words) {
                tmp = read32(
                    make_handle_from_handle(comp.base_addr,
                        4*(dat_i.offset+i)));
                write32(
                    make_handle_from_handle(comp.base_addr,
                        4*(dat_o.offset+i)),
                    tmp);
            }
        }
    }

    action Check {
        input mem_b                     dat_i;
        rand executor_claim_s<core_s>   core;

        exec body {
            bit[32] tmp;
            repeat (i : dat_i.words) {
                tmp = read32(
                    make_handle_from_handle(comp.base_addr,
                        4*(dat_i.offset+i)));
                if (tmp != i+1) {
                    error("0x%08x: expect %d ; receive %d",
                        4*(dat_i.offset+i), i+1, tmp);
                }
            }
        }
    }

    action WriteCopyCheck {
        Write             write;
        Copy              copy;
        Check             check;

        activity {
            write;
            copy;
            check;
            bind write.dat_o copy.dat_i;
            bind copy.dat_o check.dat_i;
        }
    }

    action Write2xCopyCheck {
        Write             write;
        Copy              copy1, copy2;
        Check             check;

        activity {
            write;
            copy1;
            copy2;
            check;
            bind write.dat_o copy1.dat_i;
            bind copy1.dat_o copy2.dat_i;
            bind copy2.dat_o check.dat_i;
        }
    }
}

component pss_top {
    executor_c<core_s>         core[4];
    executor_group_c<core_s>   cores;
    transparent_addr_space_c<> aspace;
    memtest_c                  memtest;

    pool mem_b mem_b_p;
    bind mem_b_p *;

    exec init {
        foreach (core[i]) {
            core[i].trait.id = i;
            cores.add_executor(core[i]);
        }

        // Define a memory region
        transparent_addr_region_s<> region;
        region.addr = 0x8000_0000;
        region.size = 0x1000_0000;
        memtest.base_addr = aspace.add_region(region);
    }

    action Copy_0_1_0 {
        activity {
            do memtest_c::WriteCopyCheck with {
                write.core.trait.id == 0;
                copy.core.trait.id == 1;
                check.core.trait.id == 0;
            }
        }
    }

    action Copy_check_diff_core {
        activity {
            do memtest_c::WriteCopyCheck with {
                write.core.trait.id != check.core.trait.id;
            }
        }
    }

    action Copy_same_core {
        activity {
            do memtest_c::WriteCopyCheck with {
                write.core.trait.id == copy.core.trait.id;
                copy.core.trait.id == check.core.trait.id;
            }
        }
    }

    action Copy2x {
        activity {
            do memtest_c::Write2xCopyCheck;
        }
    }
}
```
