const lesson = (title, duration, summary, ...content) => ({
  title,
  duration,
  summary,
  content
});

export const seedCourses = [
  {
    title: 'Modern JavaScript from Zero',
    slug: 'modern-javascript-from-zero',
    tagline: 'Build a real foundation in the language behind the web.',
    description:
      'A calm, practical introduction to modern JavaScript. You will write real code from the first lesson, understand the ideas behind it, and finish with a small interactive project you can show off.',
    category: 'JavaScript',
    level: 'Beginner',
    price: 0,
    accent: 'sun',
    rating: 4.9,
    reviewCount: 1284,
    outcomes: [
      'Write clean JavaScript with confidence',
      'Work with arrays, objects, and functions',
      'Update a page with the DOM',
      'Fetch data and handle asynchronous code'
    ],
    requirements: ['A computer with a code editor', 'No programming experience needed'],
    lessons: [
      lesson(
        'Welcome to JavaScript',
        12,
        'Set up your workspace and run your first lines of code.',
        'JavaScript is the language that makes a web page respond. It runs in every browser, and with Node.js it also runs on servers. That range is why it is such a useful first language.',
        'Open the browser console and type 2 + 2. Then type your name inside quotes. You are already writing expressions: small pieces of code that produce a value.',
        'In this course, keep a folder called javascript-practice. Create an index.html file and a script.js file, connect them, and open the page in your browser. We will build on that tiny setup throughout.'
      ),
      lesson(
        'Values, variables, and decisions',
        18,
        'Store information and make your programs choose a path.',
        'A variable is a labelled box for a value. Use const when the label will not point at a new value, and let when it will. Prefer const by default; it makes your code easier to reason about.',
        'JavaScript has strings, numbers, booleans, null, and undefined. Conditional statements let you react to those values with if, else if, and else. Try writing a small age checker that prints a different message for children, adults, and seniors.',
        'The most common beginner bug is mixing up = (assignment) and === (comparison). Read each line out loud: "age is assigned 18" versus "age is equal to 18".'
      ),
      lesson(
        'Functions that click',
        22,
        'Turn repeated logic into reusable, readable helpers.',
        'A function packages a piece of behaviour behind a name. Parameters are the inputs, and return hands a value back to the caller. A function that returns a value is usually easier to test than one that only logs.',
        'Write a function called formatPrice that takes a number and returns a string such as "$24.00". Then write a second function that applies a discount. Keep each function focused on one job.',
        'Arrow functions are a shorter syntax, but the older function keyword is still useful when you want to talk about this. Choose the form that makes the intent clearest.'
      ),
      lesson(
        'Arrays and objects',
        24,
        'Organise lists of data and model real-world things.',
        'Arrays keep values in order. Objects keep values under named keys. Most application data is a combination of the two: an array of course objects, each with a title, a price, and a list of lessons.',
        'Learn map, filter, and reduce. map transforms every item, filter keeps the items that pass a test, and reduce folds a list into one value. These three methods will replace most of your for loops.',
        'Build a small course list in memory, then render only the free courses with filter and map. No framework, no database, just data and functions.'
      ),
      lesson(
        'The DOM in motion',
        26,
        'Make a page react to clicks, typing, and time.',
        'The Document Object Model is the browser’s live representation of your HTML. querySelector finds an element, addEventListener listens for an event, and textContent or classList changes what the visitor sees.',
        'Create a button that changes the heading, then a form that adds an item to a list. Store the list in an array and re-render it after every change. This is the core idea behind every UI library.',
        'Keep your event handlers small. Read the data, update the state, then call a render function. That one habit will make your projects much easier to debug.'
      ),
      lesson(
        'Async without fear',
        28,
        'Fetch real data and handle waiting gracefully.',
        'Some work takes time: network requests, file reads, timers. A Promise represents a value that will arrive later. async and await let you write that flow as if it were ordinary sequential code.',
        'Use fetch to request a JSON file. Check response.ok, parse the body with response.json(), and wrap the call in try/catch. Always show a loading state and a useful error state; real networks fail.',
        'Finish by building a small search box that fetches courses as the user types. Add a short delay with debounce so you do not send a request on every keystroke.'
      )
    ]
  },
  {
    title: 'React Apps That Ship',
    slug: 'react-apps-that-ship',
    tagline: 'Go from components and state to a deployed product.',
    description:
      'Learn React by building the pieces a real product needs: reusable components, forms, data fetching, routing, loading states, and a production deployment. This course focuses on decisions, not just syntax.',
    category: 'Web Development',
    level: 'Intermediate',
    price: 0,
    accent: 'sky',
    rating: 4.8,
    reviewCount: 862,
    outcomes: [
      'Design a small component system',
      'Manage state without overcomplicating it',
      'Fetch and cache API data',
      'Deploy a React app with confidence'
    ],
    requirements: [
      'Comfortable with JavaScript functions and arrays',
      'A basic understanding of HTML and CSS'
    ],
    lessons: [
      lesson(
        'Thinking in components',
        20,
        'Break a screen into small, named pieces.',
        'A React component is a function that returns UI. The hardest part is not the syntax; it is choosing boundaries. Start with the page, then split out repeated or independently changing regions.',
        'A good component has one reason to change. A CourseCard should not know how to fetch courses. A CourseList should not know how to format a price. Keep data loading, display, and formatting separate.',
        'Sketch your next screen on paper and draw boxes around the pieces. Name every box before writing code. You will write less and refactor less.'
      ),
      lesson(
        'State, events, and forms',
        26,
        'Make a screen respond without losing control.',
        'State is data that changes over time. Keep it as small as possible, and derive everything else during render. If a value can be calculated from existing state, it usually should not be separate state.',
        'Controlled inputs make forms predictable: the input value comes from state, and every keystroke updates that state. Add validation next to the field, not in a distant alert.',
        'When a state update depends on the previous value, use the updater form: setCount(current => current + 1). This avoids stale values in event handlers.'
      ),
      lesson(
        'Effects and data fetching',
        30,
        'Connect to an API and handle every state.',
        'useEffect runs after render so you can synchronise with something outside React. Fetching data is the classic example, but effects are also used for subscriptions and timers.',
        'Every request has at least four states: idle, loading, success, and error. Build all four into your UI. A spinner with no error path is an incomplete feature.',
        'Use an AbortController to cancel a request when a component unmounts or a search term changes. This prevents old responses from overwriting newer ones.'
      ),
      lesson(
        'Routing and layouts',
        24,
        'Give a product real pages and a consistent shell.',
        'A router maps URLs to screens. That means refresh works, links are shareable, and the back button behaves the way people expect. Client-side routing should still feel like the web.',
        'Create a layout component with the navigation and footer, then render page content through an outlet. Protected routes can redirect visitors who are not signed in.',
        'Keep route names human-readable. /courses/react-apps is easier to share and debug than /product?id=42&tab=overview.'
      ),
      lesson(
        'Ship it',
        22,
        'Build, test, and deploy the final app.',
        'A production build catches many mistakes: unused imports, type errors, and missing environment variables. Run it locally before deploying, and open the built app in a fresh browser profile.',
        'Set environment variables separately for preview and production. Never commit a .env file. Add a health check and a useful 404 page.',
        'Deploy, then test the real URL on a phone. Check the slow network experience. A product is not finished when it builds; it is finished when someone else can use it.'
      )
    ]
  },
  {
    title: 'Node.js & MongoDB API Bootcamp',
    slug: 'nodejs-mongodb-api-bootcamp',
    tagline: 'Design, secure, and deploy a production-style REST API.',
    description:
      'Build the backend behind a real course platform. You will model data in MongoDB, add JWT authentication, validate requests, handle errors, and deploy an Express API to Vercel.',
    category: 'Backend',
    level: 'Intermediate',
    price: 0,
    accent: 'mint',
    rating: 4.9,
    reviewCount: 654,
    outcomes: [
      'Structure an Express application',
      'Model relationships in MongoDB',
      'Secure routes with JWT cookies',
      'Deploy a serverless API to Vercel'
    ],
    requirements: [
      'Basic JavaScript',
      'A free MongoDB Atlas account',
      'Node.js installed on your computer'
    ],
    lessons: [
      lesson(
        'HTTP, Express, and the shape of an API',
        22,
        'Understand the request lifecycle before adding features.',
        'Every API request has a method, a path, headers, and sometimes a body. A response has a status code and a body. Learn to read that exchange in the browser Network tab before you memorise framework methods.',
        'Express is a small layer over Node’s HTTP server. Middleware functions run in order and can read the request, change it, end the response, or pass control onward with next().',
        'A clean API uses nouns for resources: GET /courses, POST /courses, PATCH /courses/:id. Keep verbs out of the URL and let the HTTP method carry the action.'
      ),
      lesson(
        'MongoDB modelling with Mongoose',
        28,
        'Choose good documents, references, and indexes.',
        'MongoDB stores flexible documents. That freedom is useful, but it is not an excuse to skip modelling. Decide what is embedded and what is referenced based on how the data is read and updated.',
        'A lesson belongs to one course and is usually read with that course, so embedding lessons inside the course document is a good fit here. An enrollment connects a user and a course, so it deserves its own collection.',
        'Add a unique compound index on { user, course } for enrollments. Indexes are not decoration; they enforce rules and keep queries fast as data grows.'
      ),
      lesson(
        'Authentication with JWT cookies',
        30,
        'Sign users in and protect private routes.',
        'A password should never be stored directly. Hash it with bcrypt, compare hashes at login, and return a generic error when either the email or password is wrong.',
        'A JSON Web Token contains signed claims. Store it in an httpOnly cookie so JavaScript cannot read it. Set secure in production and sameSite to protect against cross-site requests.',
        'Write one middleware that reads and verifies the token, and another that requires a signed-in user. Role checks should be a separate guard, not an if statement copied into every route.'
      ),
      lesson(
        'Validation and useful errors',
        24,
        'Fail clearly at the edge of your application.',
        'Validate every body, query, and parameter. Zod lets you describe the shape you expect and returns field-level errors you can show in a form.',
        'Use a small ApiError class with a status code. A central error handler turns known errors into clean JSON responses and logs unexpected ones.',
        'Never send a stack trace to the browser in production. Do log it on the server with enough context to debug the request.'
      ),
      lesson(
        'Deploying Express to Vercel',
        26,
        'Take the API from localhost to a public URL.',
        'Vercel can detect an Express app and run it as a serverless function. Static files live in public/, and the Express app handles the API. Connection caching matters because function instances are reused.',
        'Create a MongoDB Atlas cluster, add a database user, and allow access from Vercel. Put MONGODB_URI and JWT_SECRET in Vercel’s environment variables, never in the repository.',
        'Deploy, open /api/health, and test a real login from the deployed frontend. If cookies fail, check sameSite, secure, and whether the frontend and API share an origin.'
      )
    ]
  },
  {
    title: 'CSS Layout Masterclass',
    slug: 'css-layout-masterclass',
    tagline: 'Build layouts that feel intentional on every screen.',
    description:
      'Move beyond fighting with floats. Learn flexbox, grid, responsive patterns, and the small visual details that make an interface feel designed instead of assembled.',
    category: 'Design',
    level: 'Beginner',
    price: 0,
    accent: 'rose',
    rating: 4.7,
    reviewCount: 932,
    outcomes: [
      'Build layouts with flexbox and grid',
      'Create responsive spacing systems',
      'Avoid common overflow and centring bugs',
      'Add motion that supports usability'
    ],
    requirements: ['Basic HTML', 'A code editor and a browser'],
    lessons: [
      lesson(
        'The box model, without the confusion',
        16,
        'Understand what actually takes up space.',
        'Every element is a box made of content, padding, border, and margin. Set box-sizing: border-box on everything so width includes padding and border. That one rule removes a surprising number of layout bugs.',
        'Margins collapse between some block elements. Padding does not. When spacing behaves strangely, inspect the box in DevTools and look at the coloured overlay before changing values randomly.',
        'Use DevTools to hover every box on a page you admire. Ask what is content, what is spacing, and what is decoration.'
      ),
      lesson(
        'Flexbox for one-dimensional layout',
        22,
        'Align rows and columns without guessing.',
        'Flexbox distributes space along one axis. display: flex creates the context; justify-content handles the main axis and align-items handles the cross axis. gap is usually cleaner than margins between children.',
        'Use flex: 1 on a child that should absorb remaining space. Use flex-wrap when items should move to a new line. Do not use flexbox for a full two-dimensional page grid; that is grid’s job.',
        'Build a navigation bar, a card with a footer pinned to the bottom, and a media object with an avatar and text. Those three patterns cover most flexbox work.'
      ),
      lesson(
        'CSS Grid for real layouts',
        26,
        'Place content in rows and columns deliberately.',
        'Grid is for two-dimensional layout. Define columns with grid-template-columns, add gaps, and let auto-placement do the routine work. Use named areas when a layout has a clear visual structure.',
        'repeat(auto-fit, minmax(260px, 1fr)) creates a responsive card grid without media queries. It is one of the most useful lines in modern CSS.',
        'Keep grid for the page and flexbox for the contents of a component. Mixing the two is normal; forcing one tool to do everything is not.'
      ),
      lesson(
        'Responsive patterns that hold up',
        24,
        'Design from small screens outward.',
        'Start with the smallest layout, then add min-width media queries when the content needs more room. Breakpoints should follow the design, not a list of device names.',
        'Use clamp() for fluid type, min() and max() for sensible widths, and aspect-ratio for media. Let the browser do more of the resizing work.',
        'Test at 320px, 768px, and a wide desktop. Zoom to 200%. If the layout still works, you have built something resilient.'
      ),
      lesson(
        'Motion and final polish',
        18,
        'Make interactions feel responsive, not distracting.',
        'Motion should explain a change: a menu opening, a card lifting, a form confirming. Keep durations short, usually 150–250ms, and animate transform and opacity for smooth performance.',
        'Respect prefers-reduced-motion. Some people experience dizziness or nausea from movement; a media query lets you remove non-essential animation for them.',
        'Finish with focus-visible styles, a clear hover state, and consistent border radii. Polish is mostly consistency repeated in small places.'
      )
    ]
  },
  {
    title: 'UI Design Foundations',
    slug: 'ui-design-foundations',
    tagline: 'Make interfaces clearer, calmer, and easier to trust.',
    description:
      'A practical introduction to visual hierarchy, typography, spacing, colour, and component design for developers who want their work to look and feel professional.',
    category: 'Design',
    level: 'Beginner',
    price: 0,
    accent: 'violet',
    rating: 4.8,
    reviewCount: 711,
    outcomes: [
      'Create a clear visual hierarchy',
      'Build a reusable spacing and type scale',
      'Choose accessible colour palettes',
      'Design consistent interface components'
    ],
    requirements: ['Curiosity about design', 'Figma is helpful but not required'],
    lessons: [
      lesson(
        'Hierarchy before decoration',
        18,
        'Help the eye know where to go first.',
        'Hierarchy is the order in which people notice things. Size, weight, contrast, spacing, and position all create it. If everything is bold, nothing is.',
        'Pick one primary action per screen. Give it the strongest contrast. Secondary actions should be quieter, and destructive actions should be visually distinct without being the loudest thing on the page.',
        'Squint at your screen. What do you see first, second, and third? If the answer does not match the task, adjust the hierarchy.'
      ),
      lesson(
        'Type and spacing systems',
        22,
        'Replace one-off values with a small scale.',
        'Choose a type scale with four or five sizes, not twelve. Set line-height generously for body text and tighter for headings. A comfortable reading width is roughly 60–75 characters.',
        'Use an 8px spacing scale: 4, 8, 12, 16, 24, 32, 48, 64. Consistency in spacing makes unrelated components feel like they belong together.',
        'Define these values as CSS custom properties. A design system starts the moment you stop retyping magic numbers.'
      ),
      lesson(
        'Colour with a job',
        20,
        'Use colour to communicate, not just decorate.',
        'Start with a neutral palette for text, surfaces, and borders. Add one brand colour and a small set of semantic colours for success, warning, and danger.',
        'Check contrast against WCAG: 4.5:1 for normal text and 3:1 for large text. Colour should never be the only way to communicate an error or status.',
        'Use tints and shades from the same hue family. A random collection of saturated colours will feel noisy even if each colour is attractive on its own.'
      ),
      lesson(
        'Components and states',
        24,
        'Design how things behave, not just how they look.',
        'A button has more states than default: hover, focus, active, disabled, loading. A form field has default, focus, error, success, and disabled. Design the states before you build.',
        'Reuse a small set of components and let variants handle differences. A card, input, button, badge, and modal will cover most of a course platform.',
        'Write down the rules for each component. What happens when the label is long? When there is no image? When the user is on a phone? Edge cases are part of the design.'
      ),
      lesson(
        'Critique and iteration',
        16,
        'Improve a screen without redesigning everything.',
        'Good critique is specific. “This feels off” is a starting point, not feedback. Name the element, the problem, and the effect on the user.',
        'Compare your screen to a strong reference. Look at spacing, alignment, type scale, and contrast. Do not copy the visual style; copy the discipline.',
        'Make one change at a time and test it. A design improves through small, deliberate iterations, not one dramatic rewrite.'
      )
    ]
  },
  {
    title: 'Launch Your Developer Career',
    slug: 'launch-your-developer-career',
    tagline: 'Turn projects into proof, and interviews into offers.',
    description:
      'A practical guide for students and career switchers. Build a portfolio that stands out, write a README people actually read, prepare for technical interviews, and negotiate your first offer.',
    category: 'Career',
    level: 'Beginner',
    price: 0,
    accent: 'sand',
    rating: 4.9,
    reviewCount: 1502,
    outcomes: [
      'Choose a realistic first role',
      'Build a portfolio around proof of work',
      'Write a README that explains your decisions',
      'Prepare for behavioural and technical interviews'
    ],
    requirements: ['At least one small project', 'Willingness to ask for feedback'],
    lessons: [
      lesson(
        'Choose a lane',
        15,
        'Focus your energy on a role you can actually target.',
        '“I want a tech job” is too broad to prepare for. Frontend, backend, data, QA, product, and support are different jobs with different interviews. Pick one primary lane for the next six months.',
        'Look at twenty job posts for that lane. Highlight the skills that appear repeatedly. Those are your curriculum. Ignore the one company asking for ten years of experience in a three-year-old framework.',
        'Write a one-sentence target: “I am looking for a junior frontend role building accessible React interfaces.” Specific is easier to help.'
      ),
      lesson(
        'A portfolio that proves something',
        22,
        'Show decisions, not just screenshots.',
        'Three good projects beat twelve tutorials. A good project solves a real problem, has a clear user, and includes at least one hard decision you can explain.',
        'For each project, write the problem, the constraints, what you built, and what you would do next. Link the live site and the repository. Make the first screen of the README a clear summary, not a wall of setup commands.',
        'Include one project that is not a clone. A small tool for your community, a better workflow for a local business, or a data visualisation you care about will start better conversations.'
      ),
      lesson(
        'GitHub and the README',
        18,
        'Make your work easy to understand and run.',
        'Recruiters skim. Engineers run code. A strong README answers: what is this, why does it exist, what stack does it use, how do I run it, and what did you learn?',
        'Add screenshots or a short GIF. Include environment variable setup and seed instructions. If the app needs a database, explain how to get one running.',
        'Use branches and pull requests even when working alone. A readable commit history shows professional habits.'
      ),
      lesson(
        'Interview preparation',
        24,
        'Practise the story and the craft.',
        'Technical interviews test communication as much as knowledge. Think aloud, clarify the requirements, describe tradeoffs, and test your solution with an example.',
        'Prepare six behavioural stories: a conflict, a failure, a difficult bug, a shipped project, a time you learned quickly, and a time you helped someone. Use the situation-action-result structure.',
        'For coding practice, solve fewer problems but explain each one fully. A clear solution to a medium problem is better than a memorised solution to a hard one.'
      ),
      lesson(
        'Offers, negotiation, and growth',
        18,
        'Start your career with clear expectations.',
        'An offer is a package: salary, learning, mentorship, flexibility, and stability. Ask about the team, the code review process, and what success looks like in the first ninety days.',
        'Negotiate respectfully with a specific range and a reason. It is normal to ask for time to consider an offer. Get the important terms in writing.',
        'Your first job is a starting point, not a life sentence. Optimise for learning and good colleagues. Those compound faster than a small salary difference.'
      )
    ]
  }
];
