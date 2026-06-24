# Main Prompts used

## Starting Prompt

In @syllabus-planner create a Tailwind + Shadcd + Next.js + FastAPI application with Supabase as database. The application is a syllabus planner that must manage the program structure, contents, and metadata.

The scructure includes:

- sections or microsyllabus: a syllabus can be reused as a section into another syllabus). A section has multiple modules. It has a title, a description, hourse per module, extra hours per module and it totalize the amount of days/modules and hours that it contains.
- modules: a set of contents (learnpack content schemas, exercises and projects suggestions). Each module has a title, a set of contents and metadata

The metadata:

- skills: 1+ skills to be developed with that module. It can be selected from an autocomplete list or created if it doesn't exists.
- how to think: guidelines of the main reflective knwoledge to develop and thinking way
- best practices to follow
- patterns to apply
- antipatterns to be avoided
- limitations: when there should be some restrictions

### Agents first

- IMPORTANT: Every action posible must be redacted as an skill before creating any functionality in frontend. Agents must be able to perform using the API

### UI

- The interface must be drag&drop. For example: Two sections or two modules can be interchangeable, reordering them with drag&drop.
- Groups must be clearly identifiable visually to understand what is a section, what is a module, what are contents...

### Export to CSV

A syllabus plan must be exportable as a CSV following the same structure and formats than @course-outline-generator/ai-engineering/New Syllabus AI Engineer - Planificación del programa.csv. For example:

- Section title: `### MODULE TITLE ###`
- Theory section starting with `> Theory:`
- Exercise and Projects section starting with `> Projects` or `> Exercises`
- Lesson or content name: `+ Lesson title`

Ask whatever you need to complete the specifications.
