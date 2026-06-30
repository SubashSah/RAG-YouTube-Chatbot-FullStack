

import { Spinner } from "@/components/ui/spinner"

export default function Loading({ ref }) {

    return (
        <>
            <dialog
                ref={ref}
                className="m-auto w-170 h-90 z-10 text-white bg-slate-900/95 rounded-2xl  "
            >
                <div className="w-170 h-90 flex flex-col justify-center items-center gap-2 rounded-2xl">
                    <Spinner className="size-17" />
                    <h2 className="text-xl font-semibold">LOADING...</h2>
                    <p>It may take few seconds.</p>
                </div>

            </dialog>

        </>
    )
}
//fixed left-1/2 top-[45%] -translate-x-1/2 -translate-y-1/2
