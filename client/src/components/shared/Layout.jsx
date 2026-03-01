// Shared components go here
import { Outlet } from 'react-router-dom'

export default function Layout() {
    return (
        <div className="flex justify-center items-center h-screen">
            <Outlet />
        </div>
    )
}