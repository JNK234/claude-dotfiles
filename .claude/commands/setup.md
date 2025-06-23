Make sure there is a CLAUDE.md. If there isn't, exit this prompt, and instruct the user to run /init
Make sure there is a `PLAN-PROGRESS` folder exists. If not create it and store all the project related files, claude sessions should be stored in this folder. 

If there is, add the following info:

Python stuff:

- we use uv for python package management
- you don't need to use a requirements.txt
- run a script by `uv run <script.py>`
- add packages by `uv add <package>`
- packages are stored in pyproject.toml

Workflow stuff:

- if there is a todo.md, then check off any work you have completed.

Tests:

- Make sure testing always passes before the task is done

Linting:

- Make sure linting passes before the task is done

If @CLAUDE.md already exists, check the file to understand the current status of the project. If it doesn't contain any useful or related information about the codebase, run the `/init` command and update the CLAUDE.md file.