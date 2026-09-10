import Image from "next/image";
import type { FormAction, FormState, MediaCategory } from "./formReducer";

const CATEGORIES: MediaCategory[] = ["movie", "tv show", "anime", "documentary"];

export default function IdentitySection({form, dispatch}: {form: FormState, dispatch: React.Dispatch<FormAction>}) {
  return (
    <fieldset className="grid content-start items-start gap-6">
      <div className="flex flex-col gap-2">
        <label htmlFor="title">Title</label>
        <input
          className="input w-full required"
          id="title"
          type="text"
          name="title"
          value={form.title}
          onChange={
            (e) => dispatch({ type: "setField", field: "title", value: e.target.value })
          }
        />
      </div>
      {form.image && (
        <div className="flex items-end gap-4">
          <Image
            src={form.image}
            alt={"Poster of " + form.title}
            width={80}
            height={120}
            className="h-30 w-20 rounded object-cover"
          />
          <button
            className="btn btn-outline btn-xs"
            type="button"
            onClick={() => dispatch({type: "setField", field: "image", value: null})}
          >
            Remove Image
          </button>
        </div>
      )}
      <div className="flex flex-col gap-2">
        <label htmlFor="category">Category</label>
        <select
          className="select w-full capitalize"
          id="category"
          name="category"
          value={form.category}
          onChange={(e) => dispatch({type: "setCategory", category: e.target.value as MediaCategory})}
        >
          {CATEGORIES.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
    </fieldset>
  )
}