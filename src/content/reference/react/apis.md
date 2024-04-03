---
title: "Built-in React APIs"
---

<Intro>

In addition to [Hooks](/reference/react) and [Components](/reference/react/components), the `react` package exports a few other APIs that are useful for defining Components. This page lists all the remaining modern React APIs.

</Intro>

---

* [`createContext`](/reference/react/createContext) lets you define and provide context to the child Components. Used with [`useContext`.](/reference/react/useContext)
* [`forwardRef`](/reference/react/forwardRef) lets your Component expose a DOM node as a ref to the parent. Used with [`useRef`.](/reference/react/useRef)
* [`lazy`](/reference/react/lazy) lets you defer loading a Component's code until it's rendered for the first time.
* [`memo`](/reference/react/memo) lets your Component skip re-renders with same props. Used with [`useMemo`](/reference/react/useMemo) and [`useCallback`.](/reference/react/useCallback)
* [`startTransition`](/reference/react/startTransition) lets you mark a state update as non-urgent. Similar to [`useTransition`.](/reference/react/useTransition)
