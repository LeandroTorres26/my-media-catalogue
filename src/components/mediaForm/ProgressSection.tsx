import { hasProgress, type FormAction, type FormState, type MediaStatus } from "./formReducer";

const STATUSES: MediaStatus[] = [
  "watching",
  "on hold",
  "completed",
  "dropped",
  "planning",
];

export default function ProgressSection({form, dispatch}: {form: FormState, dispatch: React.Dispatch<FormAction>}) {
    const numberOrUndefined = (value: string) => value === "" ? undefined : Number(value);

    return (
        <fieldset className="grid content-start gap-6">
            <div className="flex flex-col gap-2">
                <label htmlFor="status">Status</label>
                <select
                    className="select w-full capitalize"
                    id="status"
                    name="status"
                    value={form.status}
                    onChange={(e) => dispatch({type: "setStatus", status: e.target.value as MediaStatus})}
                >
                    {STATUSES.map((option) => (
                        <option key={option} value={option}>
                            {option}
                        </option>
                    ))}
                </select>
            </div>
            {hasProgress(form) && (
                <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                        <label htmlFor="season">Season</label>
                        <input
                            className="input w-full"
                            id="season"
                            type="number"
                            name="season"
                            min={1}
                            value={form.season ?? ""}
                            onChange={(e) => dispatch({type:"setField", field: "season", value: numberOrUndefined(e.target.value)})}
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label htmlFor="episode">Episode</label>
                        <input
                            className="input w-full"
                            id="episode"
                            type="number"
                            name="episode"
                            min={1}
                            value={form.episode ?? ""}
                            onChange={(e) => dispatch({type:"setField", field: "episode", value: numberOrUndefined(e.target.value)})}
                        />
                    </div>
                </div>
            )}
        </fieldset>
    )
}