## Traversal

Component trees run DFS, meaning a tree like below will be processed as: App -> A1 -> A2 -> B1

```
      App
     /  \
    A1   B1
   /
  A2
```

Triggers that occur at the top-most level (App) are easy to process. Even if there are multiple triggers (e.g. setState dispatches), they trickle down the tree when collecting the renders.

## Issue with single global trigger

The problem occurs when a sub component resets the trigger. Let's say A2 sets the trigger (some state value is different, trigger happens to be reset). This means it becomes tracked as such:

```
      App (🔥App)
     /          \
    A1 (🔥App)   B1 (🔥A2)
   /
  A2 (🔥A2)
```

This no longer makes any sense. A2 is not the cause of B1's trigger, App is.

## Supporting hooks

With hooks, this becomes a bit more complicated. Since hooks run "inline" to a component, the trigger needs to be populated up to the host component. For components, they can only "flow down"

```
      App (🔥useApp) <- useApp (🔥useApp)
     /              \
    A1 (🔥useApp)   B1 (🔥useApp)
   /
  A2 (🔥useA2) <- useA2 (🔥useA2)
```

## Issue with linking parents

Say we track owners every component, and we rely those owner to be "linked" back. This way, we can pass the trigger down to children owners. The problem here is that parent <> child don't link with the try...finally pattern, but hooks do:

```
         App   -> useApp (^App)
      /      \
    A1 (^?)   B1 (^?)
   /
  A2 (^?)
```

One way to get this working is useEffect, but this throws off the DFS traversal and actually does traversal in reverse. If you log inside the useEffect, it would be: A2 -> A1 -> B1 -> useApp -> App
