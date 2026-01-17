import * as Sentry from "@sentry/tanstackstart-react";

Sentry.init({
  dsn: "https://dbf8d6e74b9a4e619283189ef0224289@ratestuffonline.bugsink.com/1",
  sendDefaultPii: true,
});
