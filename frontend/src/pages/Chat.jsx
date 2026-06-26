
import { useSearchParams } from "react-router";
import VideoInsights from "../components/VideoInsights";
import Messenger from "../components/Messenger";



export default function ChatPage() {
    const [searchParams] = useSearchParams();

    const url = searchParams.get("url");

    return (
        <>
            <div className="flex gap-2  h-[90vh] mx-1">
                <aside className="border border-slate-500 w-[35%] rounded-md ">
                    <VideoInsights url={url} />
                </aside>

                <main className="border border-slate-500 w-[65%] relative rounded-md ">
                    <Messenger />
                </main>
            </div>

        </>
    )
}