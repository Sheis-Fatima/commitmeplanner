# gODtECH Agent Contract — commitmeplanner

This repository participates in the gODtECH Cockpit project graph.

## Project context

Adaptive commitment planning workspace. Deterministic planning logic is the source of truth; AI is assistive.

## Working rules

Do not let AI silently change the scheduling engine. Preserve real-life constraints, commitments and capacity semantics. Verify the planner before changing UI-only behavior.

## Before work

- Read this file and `.godtech/project.yml` before meaningful implementation.
- Inspect the current repository, relevant issue/PR, dependencies, tests and configuration before changing code.
- Prefer the smallest robust change that solves the requested outcome.
- Do not invent requirements or claim completion without evidence.

## Delivery

- Keep one coherent change per branch/PR where repository policy requires it.
- Run the applicable checks before declaring meaningful work complete.
- Do not bypass security, CI, repository rules or approval requirements.

## Cockpit synchronization

After meaningful development work, reconcile `.godtech/project.yml` with the evidence. Update state, priority, current focus, next step, blockers, status note and last worked date only when warranted. Keep it concise. Never fabricate progress.