/**
 * One-off: insert the Chicken Parmesan recipe into the connected DB.
 * Run locally: `npx tsx --env-file=.env server/add-recipe.ts`
 * Idempotent — upserts by slug.
 */
import mongoose from "mongoose";
import { connectDB } from "./lib/db";
import { Recipe } from "./models/Recipe";
import { slugify } from "./lib/slug";

const recipe = {
  title: "Crispy Baked Chicken Parmesan",
  description: "Golden, fried-looking crust without the frying — over spaghetti.",
  dateCooked: new Date(),
  ingredients: [
    "4 boneless skinless chicken breasts",
    "1.5 cups panko breadcrumbs",
    "0.8 cups grated parmesan cheese",
    "0.5 cups all-purpose flour",
    "2 large eggs",
    "1 teaspoon garlic powder",
    "1 teaspoon dried Italian herbs",
    "1 teaspoon salt",
    "0.5 teaspoon black pepper",
    "2 tablespoons olive oil or cooking spray",
    "1.5 cups marinara sauce",
    "1.5 cups shredded mozzarella cheese",
    "2 tablespoons fresh basil, chopped (optional)",
  ],
  steps: [
    "Preheat oven to 425°F (220°C). Line a baking sheet with parchment, or set a wire rack on a baking sheet for maximum crispiness.",
    "Place the chicken breasts between two sheets of plastic wrap and pound to about 1/2 inch thick for fast, even cooking.",
    "Set up three shallow bowls: (1) flour with half the salt and pepper; (2) beaten eggs; (3) panko mixed with half the parmesan, the garlic powder, Italian herbs, and remaining salt and pepper.",
    "Dredge each piece of chicken in flour (shake off excess), dip in egg, then press firmly into the panko mixture to coat both sides.",
    "Place breaded chicken on the prepared sheet. Drizzle or spray the tops with olive oil — this gives the golden, fried-looking crust without frying.",
    "Bake at 425°F for about 18 minutes, until the crust is golden and the chicken is nearly cooked through (internal temp around 160°F).",
    "Remove from oven. Spoon a few tablespoons of marinara on each piece (don't drown it — keep the edges crispy). Sprinkle generously with mozzarella and the remaining parmesan.",
    "Bake 5–8 more minutes until the cheese is melted and bubbly. For browned cheese, broil the last couple minutes — watch closely so it doesn't burn.",
    "Let rest 4 minutes, then garnish with fresh basil if using. Serve over spaghetti with extra marinara on the side.",
  ],
  tags: ["chicken", "dinner", "italian", "comfort food"],
  cuisine: "Italian",
  prepMinutes: 25,
  cookMinutes: 26,
  servings: 4,
  rating: 5,
  makeAgain: true,
  notes: "Pounding the breasts thin is the trick — even cooking and more crust per bite.",
  createdBy: "tmswartz12@gmail.com",
};

async function run() {
  await connectDB();
  const slug = slugify(recipe.title);
  await Recipe.findOneAndUpdate(
    { slug },
    { $set: { ...recipe, slug } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  console.log(`✓ upserted: ${recipe.title} (/${slug})`);
  const count = await Recipe.countDocuments();
  console.log(`Total recipes: ${count}`);
  await mongoose.disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
