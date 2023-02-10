# Migrate data from v1 of math3d-react

:see_no_evil: :see_no_evil: :see_no_evil:

_This script is a little messy and has lots of explicit `any` types._

:see_no_evil: :see_no_evil: :see_no_evil:

## Why

In v1 of math3d, visualizations are saved in a "dehydrated" form. Each math object is diff'd with the default values for that type of object before storing in the database.

This was an effort to save space. But... it doesn't take that much space to just store the whole object, including default values.

So let's do that instead.

Additional changes:

- move metaData to separate columns
- Combine `mathObjects`, `mathSymbols`, and `Folders` keys into a single `mathItems` key differentiated by their `type` values.
- Include `type` for folders.
- Store each `mathItem`'s id on the `mathItem` itself.
- move all customizable mathItem properties to a `properties` key, so all `mathItems` have a standard for, namely: `{ id, type, properties }`.
- store sliderValues on the slider mathItems

## Usage

Suggested usage:

1. Export `graphs` table from production database (e.g., with TablePlus) **as JSON**.
2. Run

   ```sh
   node build/scripts/transfer-from-v1 \
     --in <path_to_v1_json> \
     --out <path_to_migrated_json>
   ```

3. Upload migrated json to new `scenes` table (e.g., using TablePlus).

Automating the "export from db, import to db" portion does not seem worthwhile right now.
