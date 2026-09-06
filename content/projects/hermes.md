---
title: Hermes
slug: hermes
tagline: 一个能跑腿的智能助理
description: 连接日常工具、处理重复流程，并把关键决定始终留给人的个人智能助理。
cover: hermes
tags:
  - AI
  - 生产力
status: active
date: 2026-04-12
updated: 2026-09-03
repository: ''
demo: ''
stack:
  - Agents
  - Tool Calling
  - TypeScript
featured: true
draft: false
---

## Overview

Hermes 是一个面向个人工作流的智能助理实验。它不只回答问题，也能在明确授权的边界内调用工具、整理信息并推进任务。

## Goals

- 让重复但需要上下文的工作可以被委派。
- 每一步行动都可检查、可撤销、可解释。
- 把隐私与权限边界作为产品能力，而不是附加设置。

## Features

目前原型支持结构化任务、工具调用与执行记录。对于发送消息、删除数据等高影响操作，Hermes 会保持明确的人类确认点。

## Development

Agent 的难点通常不在一次回答是否聪明，而在长任务中能否保持目标、处理失败并诚实报告状态。因此我把大量时间用在状态机、重试与审计日志上。

## Current Status

处于活跃开发阶段。当前正在缩小工具集合，先让少数工作流达到稳定可用。

## Lessons Learned

自主性不是越高越好。真正值得信任的助理，知道什么时候行动，也知道什么时候停下来问一句。
