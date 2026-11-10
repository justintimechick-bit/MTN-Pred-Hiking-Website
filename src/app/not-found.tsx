import Link from "next/link";
export default function NotFound() {
  return (
    <div className="container page-content not-found">
      <p className="section-label">404</p>
      <h1>This trail ends here.</h1>
      <p>We couldn’t find that page. There are more adventures in the archive.</p>
      <Link className="button button-yellow" href="/adventures">
        View adventures
      </Link>
    </div>
  );
}
