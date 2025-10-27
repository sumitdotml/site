---
title: 'Inside a Transformer'
description: 'explaining to myself how transformer work by looking into its mechanics'
breadcrumbTitle: 'Inside a Transformer'
pubDate: 2025-10-28
updatedDate: 2025-10-29
dateLabels:
    published: "Started: "
    updated: "Last update: "
---

> This is currently purely a worklog. Things are not formatted yet.

Reference I used for this was mainly this [Anthropic paper](https://transformer-circuits.pub/2021/framework/index.html) from 2021 & lots of QAs with Sonnet 4.5.

### On residual stream as a communication channel

Why is this the case?

Residual stream?

Lots about transformer layers (or blocks) & how information flows through them like a 'stream', as if different students in a class were given a topic to write an essay about on a long whiteboard & each student writes something new + reads what was written before

Matters mainly for 'reading' and 'writing': reading the previous layers' outputs, and writing one's output (which also happens to be the output from that nth layer added to the previous layers' outputs)

block 0 -> output -> fed to block 1 -> output (enriched with its own + block 0's info) -> fed to block 3....

this is a residual stream

reading = mainly `Q @ K^T`

writing = `x = x + attn_output`
