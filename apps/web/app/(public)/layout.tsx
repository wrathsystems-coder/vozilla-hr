export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-black focus:px-3 focus:py-2 focus:text-white"
      >
        Preskoči na sadržaj
      </a>
      <main id="main-content">{children}</main>
    </>
  );
}
