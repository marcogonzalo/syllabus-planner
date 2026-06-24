"use client";

import { FormEvent, useEffect, useState } from "react";

import {
  createSkill,
  searchSkills,
  updateModuleMetadata,
  updateModuleSkills,
} from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ModuleMetadata, Skill } from "@/types";

type MetadataFormProps = {
  moduleId: number;
  initialMetadata?: ModuleMetadata | null;
  initialSkills: Skill[];
  onSaved: () => Promise<void>;
};

export function MetadataForm({
  moduleId,
  initialMetadata,
  initialSkills,
  onSaved,
}: MetadataFormProps) {
  const [howToThink, setHowToThink] = useState(
    initialMetadata?.how_to_think || "",
  );
  const [bestPractices, setBestPractices] = useState(
    initialMetadata?.best_practices || "",
  );
  const [patterns, setPatterns] = useState(initialMetadata?.patterns || "");
  const [antipatterns, setAntipatterns] = useState(
    initialMetadata?.antipatterns || "",
  );
  const [limitations, setLimitations] = useState(
    initialMetadata?.limitations || "",
  );
  const [skills, setSkills] = useState<Skill[]>(initialSkills);
  const [skillQuery, setSkillQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Skill[]>([]);
  const [saving, setSaving] = useState(false);
  const trimmedSkillQuery = skillQuery.trim();

  useEffect(() => {
    if (!trimmedSkillQuery) {
      return;
    }

    const timeout = setTimeout(() => {
      searchSkills(trimmedSkillQuery)
        .then(setSuggestions)
        .catch(() => setSuggestions([]));
    }, 250);

    return () => clearTimeout(timeout);
  }, [trimmedSkillQuery]);

  function handleSkillQueryChange(value: string) {
    setSkillQuery(value);
    if (!value.trim()) {
      setSuggestions([]);
    }
  }

  async function addSkill(skill: Skill) {
    if (skills.some((item) => item.id === skill.id)) {
      return;
    }
    setSkills((current) => [...current, skill]);
    setSkillQuery("");
    setSuggestions([]);
  }

  async function createAndAddSkill() {
    const name = skillQuery.trim();
    if (!name) {
      return;
    }
    const created = await createSkill(name);
    await addSkill(created);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      await updateModuleMetadata(moduleId, {
        module_id: moduleId,
        how_to_think: howToThink,
        best_practices: bestPractices,
        patterns,
        antipatterns,
        limitations,
      });
      await updateModuleSkills(
        moduleId,
        skills.map((skill) => skill.id),
      );
      await onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <Field
        label="How to think"
        value={howToThink}
        onChange={setHowToThink}
        placeholder="Reflective knowledge and thinking guidelines"
      />
      <Field
        label="Best practices"
        value={bestPractices}
        onChange={setBestPractices}
        placeholder="Best practices to follow"
      />
      <div className="grid gap-5 md:grid-cols-2">
        <Field
          label="Patterns"
          value={patterns}
          onChange={setPatterns}
          placeholder="Patterns to apply"
          rows={4}
        />
        <Field
          label="Anti-patterns"
          value={antipatterns}
          onChange={setAntipatterns}
          placeholder="Anti-patterns to avoid"
          rows={4}
        />
      </div>
      <Field
        label="Limitations"
        value={limitations}
        onChange={setLimitations}
        placeholder="Restrictions and limitations"
        rows={3}
      />

      <div>
        <label className="mb-2 block text-sm font-medium text-foreground">
          Skills
        </label>
        <div className="mb-2 flex flex-wrap gap-2">
          {skills.map((skill) => (
            <button
              key={skill.id}
              type="button"
              onClick={() =>
                setSkills((current) =>
                  current.filter((item) => item.id !== skill.id),
                )
              }
            >
              <Badge variant="secondary">{skill.name} ×</Badge>
            </button>
          ))}
        </div>
        <div className="relative">
          <Input
            value={skillQuery}
            onChange={(event) => handleSkillQueryChange(event.target.value)}
            placeholder="Search or create skill"
          />
          {suggestions.length > 0 ? (
            <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-border bg-card shadow-md">
              {suggestions.map((skill) => (
                <button
                  key={skill.id}
                  type="button"
                  onClick={() => addSkill(skill)}
                  className="block w-full px-3 py-2 text-left text-sm hover:bg-muted"
                >
                  {skill.name}
                </button>
              ))}
            </div>
          ) : null}
        </div>
          {trimmedSkillQuery ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={createAndAddSkill}
          >
            Create skill &quot;{trimmedSkillQuery}&quot;
          </Button>
        ) : null}
      </div>

      <Button type="submit" disabled={saving}>
        {saving ? "Saving..." : "Save Metadata"}
      </Button>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  rows = 5,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  rows?: number;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-foreground">
        {label}
      </label>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        placeholder={placeholder}
        className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      />
    </div>
  );
}
