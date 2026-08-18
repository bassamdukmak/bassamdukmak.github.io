import { env } from "cloudflare:workers";

export const runtime = "edge";

type TrackingEnvironment = {
  GA4_MEASUREMENT_ID?: string;
  META_PIXEL_ID?: string;
};

function safeGa4Id(value: string | undefined) {
  return value && /^G-[A-Z0-9]+$/i.test(value) ? value : "";
}

function safeMetaId(value: string | undefined) {
  return value && /^\d{5,30}$/.test(value) ? value : "";
}

export async function GET() {
  const runtimeEnv = env as unknown as TrackingEnvironment;
  return Response.json(
    {
      ga4MeasurementId: safeGa4Id(runtimeEnv.GA4_MEASUREMENT_ID),
      metaPixelId: safeMetaId(runtimeEnv.META_PIXEL_ID),
    },
    {
      headers: {
        "Cache-Control": "public, max-age=300",
      },
    },
  );
}
