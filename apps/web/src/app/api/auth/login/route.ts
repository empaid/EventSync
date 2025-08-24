
import { NextResponse } from "next/server";

type LoginBody = {email: string, password: string}

const API_BASE_URL = process.env.STUDIO_BASE_URL!;
const COOKIE_NAME = process.env.COOKIE_NAME || 'accessToken';

function setAuthCookie(res: NextResponse, token: string) {
    res.cookies.set({
        name: COOKIE_NAME,
        value: token,
        httpOnly: true,
        sameSite: "lax",
        path: "/"
    });
}

export async function POST(req: Request) {
    try {
        const body = (await req.json()) as LoginBody;
        if(!body?.email || !body?.password){
            return NextResponse.json({ok: false, error: "Missing credentials"}, {status: 400});
        }

        const apiResponse = await fetch(`${API_BASE_URL}/users/login`, {
            "method": "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(body)
        });
        const data = await apiResponse.json();

        if(!apiResponse.ok){
            const error = data?.error || "Login Failed"
            return NextResponse.json({ok: false, error: error}, {status: apiResponse.status})
        }
        const accessToken = data?.accessToken;
        if(!accessToken){ 
            return NextResponse.json({ok: false, error: "Invalid response from server"}, {status: 500});
        }
        const response = NextResponse.json({ok: true, user: data?.user ?? null})
        setAuthCookie(response, accessToken);
        return response;
    } catch(err){
        return NextResponse.json({ok: false, error: "Something unexpected happened"}, {status: 500})
    }
}
