import { describe, it, expect } from "vitest";
import { supabase } from "@/lib/supabase";

describe("Supabase connection", () => {
  it("should be configured with credentials", () => {
    expect(supabase).toBeDefined();
    expect(supabase).toHaveProperty("auth");
    expect(supabase).toHaveProperty("from");
  });

  it("should connect to Supabase", async () => {
    const { data, error } = await supabase.auth.getSession();
    expect(error).toBeNull();
    expect(data).toBeDefined();
    console.log("✅ Conexão com Supabase estabelecida!");
  });
});
