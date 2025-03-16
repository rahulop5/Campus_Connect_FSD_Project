const questions=
[
    {
        heading: "How to ignore certain patterns when using git diff?",
        desc: "I would like to ignore certain changes when using git diff (such as version changes). I tried using the -G flag, but it doesn’t seem to work as expected. I also saw a reference to a regex in this question, but that doesn't seem to help. I am hoping to do something like this:",
        votes: 10,
        tags: ["git", "git-diff"],
        asker: 1,
        time: "24-10-2024",
        wealth: 100,
        views: 306,
        answers: [
            {
                desc: "maybe use chatgpt??",
                votes: 2,
                answerer: 2
            },
            {
                desc: "when you want to do a diff or a blame without seeing those changes, you can use a \"textconv\" filter that normalizes the text you diff. I use those to do things like strip embedded timestamps out of generated html when diffing, quickest to hand atm is so my what-changed diffs don't show me things I don't care about. If you want to see the results of a diff ignoring case, try you're done, take it outCode",
                votes: 4,
                answerer: 3
            }
        ]
    },
    {
        heading: "How to rebase a branch in Git without losing commits?",
        desc: "I am trying to rebase a feature branch onto the main branch, but I'm worried about losing some commits during the process. Can anyone explain the correct approach to rebase safely?",
        votes: 12,
        tags: ["git", "git-rebase"],
        asker: 2,
        time: "12-11-2024",
        wealth: 120,
        views: 456,
        answers: [
            {
                desc: "You can use `git rebase --interactive` to rebase safely. It allows you to pick, squash, or fixup commits during the rebase process.",
                votes: 6,
                answerer: 1
            },
        ]
    },
    {
        heading: "How to resolve merge conflicts in Git?",
        desc: "I keep running into merge conflicts when trying to merge branches in Git. What are some best practices for resolving these conflicts, especially in large teams?",
        votes: 25,
        tags: ["git", "git-merge", "merge-conflicts"],
        asker: 3,
        time: "01-12-2024",
        wealth: 150,
        views: 789,
        answers: [
            {
                desc: "You should run `git merge --abort` if you get stuck, then try resolving conflicts manually by editing the files with conflict markers.",
                votes: 10,
                answerer: 2
            },
            {
                desc: "Consider using a tool like `git mergetool` to assist in conflict resolution. Also, always ensure that team members frequently sync their branches with the main branch.",
                votes: 8,
                answerer: 1
            }
        ]
    },
    {
        heading: "How to cherry-pick a commit in Git?",
        desc: "I have a commit from another branch that I want to apply to my current branch. I’ve heard about cherry-picking, but I'm not sure how to use it. Can anyone help?",
        votes: 8,
        tags: ["git", "git-cherry-pick"],
        asker: 1,
        time: "20-09-2024",
        wealth: 90,
        views: 310,
        answers: [
            {
                desc: "Use `git cherry-pick <commit-hash>` to apply a specific commit from another branch to your current branch.",
                votes: 4,
                answerer: 2
            },
        ]
    }
]

export default questions;