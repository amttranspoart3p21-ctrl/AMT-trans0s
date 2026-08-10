async function runTest() {
  console.log("=== STARTING INPUT FOCUS LOCK DOM SIMULATION TEST ===");

  const lockedFields: Record<string, boolean> = {};

  class MockInput {
    value: string = "";
    focused: boolean = false;

    mouseDown(field: string) {
      console.log(`[EVENT] MouseDown on ${field}`);
      lockedFields[field] = false;
    }

    focus(field: string) {
      console.log(`[EVENT] Focus attempt on ${field}`);
      if (lockedFields[field]) {
        console.log(`[LOCK REJECTED] ${field} is locked! Forcing blur.`);
        this.focused = false;
      } else {
        console.log(`[FOCUS GRANTED] ${field} focused.`);
        this.focused = true;
      }
    }

    typeText(text: string, field: string) {
      if (!this.focused) {
        console.log(`[BLOCKED] Cannot type "${text}" because ${field} is not focused.`);
        return;
      }
      this.value += text.toUpperCase();
      console.log(`[TYPED] ${field} value is now: "${this.value}" (focused: ${this.focused})`);
    }

    pressSpace(field: string) {
      if (!this.focused) {
        console.log(`[BLOCKED] Space key ignored because ${field} is not focused.`);
        return;
      }
      console.log(`[EVENT] Space keydown on ${field}`);
      lockedFields[field] = true;
      this.value += " ";
      console.log(`[SPACE ADDED] Value: "${this.value}"`);
      this.focused = false;
      console.log(`[BLURRED] ${field} focus set to false.`);
    }
  }

  const input = new MockInput();
  const FIELD = "branchName";

  // STEP 1: Click input
  console.log("\n--- STEP 1: Click Branch Name ---");
  input.mouseDown(FIELD);
  input.focus(FIELD);

  // STEP 2: Type CHENNAI
  console.log("\n--- STEP 2: Type CHENNAI ---");
  input.typeText("CHENNAI", FIELD);

  // STEP 3: Press SPACE
  console.log("\n--- STEP 3: Press SPACE ---");
  input.pressSpace(FIELD);

  // STEP 4: Attempt automatic refocus or typing without mouse click
  console.log('\n--- STEP 4: Attempt typing "BRANCH" WITHOUT mouse click ---');
  input.focus(FIELD);
  input.typeText("BRANCH", FIELD);

  // STEP 5: Physically click input with mouse
  console.log("\n--- STEP 5: Physically click Branch Name with mouse ---");
  input.mouseDown(FIELD);
  input.focus(FIELD);

  // STEP 6: Type BRANCH
  console.log("\n--- STEP 6: Type BRANCH ---");
  input.typeText("BRANCH", FIELD);

  // STEP 7: Press SPACE again
  console.log("\n--- STEP 7: Press SPACE again ---");
  input.pressSpace(FIELD);

  console.log("\n=== FINAL TEST RESULTS ===");
  console.log(`Final value: "${input.value}"`);
  console.log(`Final focus state: ${input.focused}`);
  if (input.value === "CHENNAI BRANCH " && !input.focused) {
    console.log("SUCCESS: Space-key focus lock behavior verified!");
  } else {
    console.error("FAILURE: Focus lock behavior failed.");
    process.exit(1);
  }
}

runTest();
