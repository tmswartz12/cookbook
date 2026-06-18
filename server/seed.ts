/**
 * Seed script — inserts a few sample recipes so the UI has data immediately.
 *
 * WRITE script: run it yourself with `npm run seed`. It is idempotent — it
 * upserts by slug, so re-running updates the samples rather than duplicating.
 *
 * Hero images use Cloudinary's public demo cloud so photos render before your
 * own Cloudinary account is configured (they're stored as full secure_urls).
 */
import mongoose from "mongoose";
import { connectDB } from "./lib/db";
import { Recipe } from "./models/Recipe";
import { slugify } from "./lib/slug";

type Seed = {
  title: string;
  description: string;
  dateCooked: string;
  heroUrl: string;
  ingredients: string[];
  steps: string[];
  tags: string[];
  cuisine?: string;
  prepMinutes?: number;
  cookMinutes?: number;
  servings?: number;
  rating?: number;
  makeAgain: boolean;
  notes?: string;
};

const DEMO = "https://res.cloudinary.com/demo/image/upload";

function demoImage(id: string, w = 1600, h = 1200) {
  // Stored as a full CloudImage; publicId references the demo cloud's sample set.
  return { url: `${DEMO}/${id}.jpg`, publicId: id, width: w, height: h };
}

const SEEDS: Seed[] = [
  {
    title: "Garlicky Weeknight Pasta",
    description: "The one we make when there's nothing in the fridge but garlic.",
    dateCooked: "2026-06-10",
    heroUrl: "pasta",
    ingredients: [
      "200g spaghetti",
      "6 cloves garlic, thinly sliced",
      "1/3 cup olive oil",
      "Chili flakes",
      "Handful of parsley",
      "Parmesan, to finish",
    ],
    steps: [
      "Boil the pasta in well-salted water until just shy of al dente.",
      "Meanwhile, warm the oil and gently fry the garlic until pale gold.",
      "Add chili flakes, then a ladle of pasta water.",
      "Toss the pasta in the pan with parsley until glossy.",
      "Finish with parmesan and more pepper than feels reasonable.",
    ],
    tags: ["pasta", "weeknight", "vegetarian"],
    cuisine: "Italian",
    prepMinutes: 5,
    cookMinutes: 15,
    servings: 2,
    rating: 5,
    makeAgain: true,
    notes: "Add more garlic. Always more garlic.",
  },
  {
    title: "Sunday Morning Pancakes",
    description: "Fluffy, slightly tangy, worth getting out of bed for.",
    dateCooked: "2026-06-08",
    heroUrl: "balloons",
    ingredients: [
      "1.5 cups flour",
      "2 tbsp sugar",
      "1 tbsp baking powder",
      "1.25 cups buttermilk",
      "1 egg",
      "3 tbsp melted butter",
    ],
    steps: [
      "Whisk the dry ingredients in one bowl, the wet in another.",
      "Fold together until just combined — lumps are fine.",
      "Rest the batter 10 minutes while the pan heats.",
      "Cook until bubbles form, then flip and finish.",
    ],
    tags: ["breakfast", "weekend"],
    cuisine: "American",
    prepMinutes: 10,
    cookMinutes: 15,
    servings: 4,
    rating: 4,
    makeAgain: true,
    notes: "Resting the batter is the whole trick. Don't skip it.",
  },
  {
    title: "Charred Summer Veg Tacos",
    description: "Smoky, bright, and gone in minutes on the porch.",
    dateCooked: "2026-06-05",
    heroUrl: "sample",
    ingredients: [
      "2 zucchini, planked",
      "1 red onion, wedged",
      "1 can black beans",
      "Corn tortillas",
      "Cotija + lime + cilantro",
    ],
    steps: [
      "Get the grill (or a cast-iron pan) screaming hot.",
      "Char the veg hard on both sides; don't fuss with them.",
      "Warm the beans with cumin and a splash of their liquid.",
      "Build tacos; finish with cotija, lime, and cilantro.",
    ],
    tags: ["tacos", "vegetarian", "summer", "grill"],
    cuisine: "Mexican",
    prepMinutes: 15,
    cookMinutes: 12,
    servings: 3,
    rating: 4,
    makeAgain: true,
    notes: "Double the limes. The char needs the acid.",
  },
  {
    title: "Aunt May's Lemon Olive Oil Cake",
    description: "Aunt May's recipe that immediately became ours.",
    dateCooked: "2026-05-28",
    heroUrl: "dessert",
    ingredients: [
      "1 cup olive oil",
      "1 cup sugar",
      "3 eggs",
      "Zest + juice of 2 lemons",
      "1.5 cups flour",
      "1.5 tsp baking powder",
    ],
    steps: [
      "Beat the eggs and sugar until pale and thick.",
      "Stream in the olive oil, then the lemon.",
      "Fold in the dry ingredients gently.",
      "Bake at 350°F for ~40 min until a skewer comes clean.",
    ],
    tags: ["dessert", "baking", "lemon"],
    cuisine: "Italian",
    prepMinutes: 15,
    cookMinutes: 40,
    servings: 8,
    rating: 5,
    makeAgain: true,
    notes: "May insists on a good fruity olive oil here — she's right.",
  },
];

async function run() {
  await connectDB();
  console.log("Connected. Upserting sample recipes…");

  for (const s of SEEDS) {
    const slug = slugify(s.title);
    await Recipe.findOneAndUpdate(
      { slug },
      {
        $set: {
          title: s.title,
          slug,
          description: s.description,
          dateCooked: new Date(s.dateCooked),
          heroImage: demoImage(s.heroUrl),
          gallery: [],
          ingredients: s.ingredients,
          steps: s.steps,
          tags: s.tags,
          cuisine: s.cuisine,
          prepMinutes: s.prepMinutes,
          cookMinutes: s.cookMinutes,
          servings: s.servings,
          rating: s.rating,
          makeAgain: s.makeAgain,
          notes: s.notes,
          createdBy: "seed@cookbook.local",
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    console.log(`  ✓ ${s.title}`);
  }

  const count = await Recipe.countDocuments();
  console.log(`Done. ${count} recipes in the collection.`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
