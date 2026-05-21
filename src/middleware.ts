export { default } from 'next-auth/middleware'

export const config = {
  matcher: ['/dashboard/:path*', '/samples/:path*', '/transfers/:path*', '/stores/:path*', '/users/:path*', '/historial/:path*'],
}
