### Purpose

This assessment is the first stage of a larger project that will continue across the subject. The project is a Wordle-style web application builder designed for Speech Pathology students and teachers, not for clients. The builder will generate HTML pages that run in a normal web browser and will allow teachers to create phoneme-based classroom activities.

Assessment 1 focuses on frontend design and usability. The purpose of this stage is to establish a clear, responsive, and user-centred interface for building and previewing phoneme-based activities. Teachers need a tool that is simple to use, flexible, and easy to understand. This assessment prepares you to apply React, usability principles, and responsive design practices to a specialist classroom tool.

### Task details

Design and implement a frontend builder interface that allows teachers to create two separate phoneme-based classroom activities: a Wordle game and a Word Search activity. In Assessment 1, the focus is on building and previewing these activities as frontend outputs. The system should be designed so that teachers can configure the activity, view the result, and generate a downloadable HTML file for use in a normal web browser.

The Wordle activity should use phoneme-based words rather than standard spelling. The Word Search activity should also be built around phoneme-based content so that the teacher can create a supporting literacy or phoneme-recognition task. At this stage, the application does not need to support a database or dynamic word-list management. Those features will be introduced in later assessments.

The output of the builder should be a single HTML file that can be downloaded and run in a normal web browser. The page should display the playable Wordle or Word Search activity clearly and should support phoneme-based content, difficulty settings, and a basic workflow for generating the activity.

The application should be designed for teachers who want to prepare activities for Speech Pathology students. It should allow the teacher to choose between the Wordle and Word Search options, preview the activity, and then generate the final HTML version.

### Instructions

You are required to:
1. **Design and implement a frontend builder interface** that includes:
    - component-based structure
    - responsive layout
    - clear navigation and workflow
    - an interface for creating and previewing Wordle-style outputs.
2. **Support phoneme-based gameplay** by designing the interface around phoneme symbols rather than standard word entry.
    - The Wordle activity should use a single phoneme-based word in Assessment 1.
    - The word list and database-driven generation will be introduced in Assessment 2.
    - The Word Search activity should include a small word list of approximately five phoneme-based words and generate a word search from that list (can be fixed at this stage)
3. **Provide phoneme-based hints and feedback**, including:
    - mouse-over hints that show the phonetic-to-English letter equivalence
    - a clear display of the phoneme word
    - a clear display of the English equivalence when the answer is correct
    - hover labels such as **/θ/** with the button label **TH (as in thin)**.
4. **Generate HTML output** that:
    - can run in a normal web browser
    - downloads as a single playable `.html` file
    - reflects the selected game settings
    - can be used as a Wordle-style classroom activity.
5. **Produce a verbal justification in the video** covering:
    - design decisions
    - component structure and scalability
    - usability considerations
    - accessibility considerations
    - trade-offs made in the frontend design
    - how the interface supports Speech Pathology students and teachers.
6. **Technical expectations:**
    - use React best practices
    - apply modular and reusable components
    - ensure code readability and maintainability
    - demonstrate a professional frontend suitable for later expansion.

### Required pages

The application should include:
- **Home** — the main landing page, with a brief introduction to the project and links to the other pages.
- **About** — explains what the project is, confirms that Assessment 1 is frontend only, and briefly describes the Wordle and Word Search tools. This page should also include your name, student number, and a short video explaining how to use the website.
- **Wordle** — creates the Wordle game with phonemes.
- **Word Search** — creates a word search with phonemes.
- **Settings** — provides interface controls such as light/dark mode themes (stored in cookies) and optional layout preferences.

### Interface requirements

The interface should include:
- a **navigation bar** or **tab bar**
- a **header** with the assessment title
- a **footer** with your name and student number
- a **hamburger menu** or **kebab menu** for compact navigation, with options such as About and Settings
- a **Generate** button that downloads the playable Wordle or Word Search activity as a single `.html` file

### Project continuity

This assessment forms the foundation for the broader project. Assessment 1 is intentionally focused on frontend design, usability, and user experience. Later assessments will introduce the word list, database, and more advanced generation options so that the builder can rotate through multiple phoneme words and produce richer outputs.

## Marking Criteria

### 1. Frontend structure, pages and overall interface design (20%)

Excellent frontend structure with clear Home, About, Wordle, Word Search and Settings pages. Navigation is logical and the layout is polished.

### 2. Themes and persistent preferences (20%)

Excellent light/dark theme support with clear visual consistency and reliable persistence.

### 3. Wordle and Word Search activity behaviour and HTML output generation (20%)

Excellent game-builder behaviour. The phoneme-based Wordle is playable, the Word Search is generated from the small word list, and the Generate button downloads a single working HTML file.

### 4. Usability, accessibility and responsive design (20%)

Highly usable, accessible and responsive interface with clear navigation, readable typography, keyboard support, and mouse-over phoneme hints such as /θ/ and TH (as in thin). 

### 5. Code quality, modularity, GitHub and verbal justification (20%)

Excellent modular architecture with reusable components and clear separation of concerns. GitHub practice is professional and the written justification is strong and well supported.
