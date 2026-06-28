import { Link, useRouteError } from "react-router";

import Header from "../components/Header";


export default function ErrorPage() {
  const error = useRouteError();

  let title = "Something went wrong!";
  let message = "An unexpected error occurred. Please try again later.";

  if (error?.status === 404) {
    title = "404 - Page Not Found";
    message = "The page you are looking for does not exist.";
  }

  if (error?.status === 500) {
    title = "500 - Server Error";
    message = JSON.parse(error.data).message;
  }

  console.log(error);

  return (
    <> 
    <Header/>
      <div className="min-h-screen flex flex-col items-center relative top-50 px-6">
        <div className="max-w-lg bg-slate-900 rounded-xl shadow-lg p-8 text-center">
          <h1 className="text-4xl font-bold text-red-600 mb-4">
            {title}
          </h1>

          <p className="text-gray-400 mb-8">
            {message}
          </p>

          <Link
            to="/"
            className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
          >
            Go Back Home
          </Link>
        </div>
      </div>
    </>
  )
}