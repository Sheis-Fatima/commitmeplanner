## Goals
1. Remove the attachments UI from the Dashboard goal cards and from the Roadmap milestone list.
2. Make the "New Goal" form fully responsive (especially on small viewports) with an always-visible primary CTA.
3. Change the floating + button (FAB) on the Dashboard so it opens a chooser ("New Goal" or "New Commitment") instead of jumping straight into the goal form.

## Changes

### 1. Remove attachments from Dashboard (`src/pages/Dashboard.tsx`)
- Remove the `import GoalAttachments from "@/components/GoalAttachments"` line.
- Remove the bottom block on each active goal card:
  ```
  <div className="mt-3 pt-3 border-t border-border">
    <GoalAttachments goalId={goal.id} />
  </div>
  ```

### 2. Remove attachments from Roadmap milestones (`src/components/MilestonesSection.tsx`)
- Remove the `import GoalAttachments` line and the per-milestone `<GoalAttachments goalId={goal.id} milestoneId={m.id} compact />` block.
- The PDF upload inside `CheckInDialog` is kept untouched.
- The `GoalAttachments` component, `useAttachments` hook, and `goal_attachments` table are left in place (dormant, not rendered) so nothing else breaks.

### 3. Responsive Create Goal dialog with sticky CTA (`src/components/CreateGoalDialog.tsx`)
At small viewports (e.g. 673×528) the dialog currently overflows and the "Create Goal" button gets pushed off-screen with no scroll affordance.

Refactor the dialog panel into a 3-region flex column constrained to viewport height, with a scrollable middle and a sticky footer:
- Outer panel: `w-full max-w-lg sm:rounded-2xl rounded-t-2xl bg-card border border-border shadow-card flex flex-col max-h-[90vh] sm:max-h-[85vh]`
- Header (title + X): `flex items-center justify-between p-4 sm:p-6 border-b border-border shrink-0`
- Body (all form fields): wrap in `<div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">` so long content scrolls.
- Footer with sticky CTA: new `<div className="p-4 sm:p-6 border-t border-border shrink-0 flex gap-2">` containing:
  - Secondary "Cancel" (`variant="outline"`, `flex-1 sm:flex-none`) calling `onClose`.
  - Existing "Create Goal" submit button: `flex-1 h-12 rounded-xl gradient-mint text-primary-foreground font-semibold text-base shadow-mint hover:opacity-90`.
- Keep current motion + `stopPropagation` on inner panel.

Result: form scrolls within the dialog and the "Create Goal" CTA is always visible at the bottom.

### 4. FAB chooser: New Goal vs New Commitment (`src/pages/Dashboard.tsx`)
Replace the current behavior where the floating + button immediately opens `CreateGoalDialog`.

- New local state: `const [showAddChooser, setShowAddChooser] = useState(false);`
- FAB `onClick` becomes `() => setShowAddChooser(true)`.
- Build a small bottom-sheet style chooser inline (matches the existing dialog pattern in `CreateGoalDialog` — `framer-motion` overlay + panel sliding from the bottom), containing two large tappable cards:
  - **New Goal** (Target icon, mint gradient accent) → closes chooser, opens `CreateGoalDialog` (`setShowCreate(true)`).
  - **New Commitment** (Briefcase icon) → closes chooser, opens `CommitmentDialog` (`setEditingCommitment(null); setShowAddCommitment(true)`).
- Each card: `w-full rounded-xl border border-border bg-card p-4 flex items-center gap-3 hover:border-primary/50` with title + one-line description ("Track a new outcome" / "Add work, classes, or recurring tasks").
- Include a header "What do you want to add?" and an X close button.
- Mobile-first: `rounded-t-2xl sm:rounded-2xl`, `max-w-md`, sticks to bottom on mobile, centered on desktop — same pattern as `CreateGoalDialog`.
- Dismiss on overlay click or X.

The top-right inline "+ New Goal" button in the greeting row keeps its current behavior (direct goal creation) for users who want the shortcut.

## Out of scope
- No DB migrations.
- No removal of `goal_attachments` table/bucket/hook (kept dormant).
- No changes to `CheckInDialog` PDF upload flow.
- No new component file for the chooser — kept inline in `Dashboard.tsx` for simplicity (small UI, single use site).
