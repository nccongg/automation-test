export default function AuthLayout({
  pageLabel = "Login",
  title,
  children,
  imageSrc,
  imageAlt = "Auth banner",
}) {
  return (
    <div className="min-h-screen bg-[#5a4949] p-4 sm:p-5 lg:p-7">
      <div className="mx-auto max-w-[1280px]">
        <p className="mb-2 pl-1 text-sm font-semibold text-white/80">
          {pageLabel}
        </p>

        <div className="grid min-h-[680px] overflow-hidden bg-white shadow-[0_12px_35px_rgba(0,0,0,0.18)] lg:grid-cols-[1fr_0.98fr]">
          <div className="hidden lg:block">
            <img
              src={imageSrc}
              alt={imageAlt}
              className="h-full w-full object-cover"
            />
          </div>

          <div className="flex items-center justify-center px-8 py-12 sm:px-12 lg:px-16">
            <div className="w-full max-w-[430px]">
              <div className="mb-8 text-center">
                <h1 className="text-[42px] font-bold leading-tight tracking-tight text-slate-800">
                  {title}
                </h1>
              </div>

              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}