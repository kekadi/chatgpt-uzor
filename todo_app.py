#!/usr/bin/env python3
"""Simple command-line TODO list manager."""

import json
import os
import sys
from typing import List

TODO_FILE = "todos.json"


def load_todos() -> List[dict]:
    if not os.path.exists(TODO_FILE):
        return []
    with open(TODO_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def save_todos(todos: List[dict]) -> None:
    with open(TODO_FILE, "w", encoding="utf-8") as f:
        json.dump(todos, f, indent=2)


def add_todo(todos: List[dict], title: str) -> dict:
    todo = {"id": len(todos) + 1, "title": title, "done": False}
    todos.append(todo)
    save_todos(todos)
    return todo


def complete_todo(todos: List[dict], todo_id: int) -> bool:
    for todo in todos:
        if todo["id"] == todo_id:
            todo["done"] = True
            save_todos(todos)
            return True
    return False


def delete_todo(todos: List[dict], todo_id: int) -> bool:
    for i, todo in enumerate(todos):
        if todo["id"] == todo_id:
            todos.pop(i)
            save_todos(todos)
            return True
    return False


def list_todos(todos: List[dict]) -> None:
    if not todos:
        print("No todos yet. Add one with: todo add <title>")
        return
    for todo in todos:
        status = "x" if todo["done"] else " "
        print(f"[{status}] {todo['id']}. {todo['title']}")


def main() -> None:
    todos = load_todos()
    args = sys.argv[1:]

    if not args:
        list_todos(todos)
        return

    command = args[0]

    if command == "list":
        list_todos(todos)

    elif command == "add":
        if len(args) < 2:
            print("Usage: todo add <title>")
            sys.exit(1)
        title = " ".join(args[1:])
        todo = add_todo(todos, title)
        print(f"Added: [{todo['id']}] {todo['title']}")

    elif command == "done":
        if len(args) < 2:
            print("Usage: todo done <id>")
            sys.exit(1)
        try:
            todo_id = int(args[1])
        except ValueError:
            print("Error: id must be an integer")
            sys.exit(1)
        if complete_todo(todos, todo_id):
            print(f"Marked {todo_id} as done.")
        else:
            print(f"No todo with id {todo_id}.")

    elif command == "delete":
        if len(args) < 2:
            print("Usage: todo delete <id>")
            sys.exit(1)
        try:
            todo_id = int(args[1])
        except ValueError:
            print("Error: id must be an integer")
            sys.exit(1)
        if delete_todo(todos, todo_id):
            print(f"Deleted todo {todo_id}.")
        else:
            print(f"No todo with id {todo_id}.")

    else:
        print(f"Unknown command: {command}")
        print("Commands: list, add <title>, done <id>, delete <id>")
        sys.exit(1)


if __name__ == "__main__":
    main()
