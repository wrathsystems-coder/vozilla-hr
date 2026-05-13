import Link from "next/link";
import { CtaButton } from "@/components/blocks/CtaButton";
import { DisclaimerBox } from "@/components/blocks/DisclaimerBox";
import { HeroImage } from "@/components/blocks/HeroImage";
import { ProsCons } from "@/components/blocks/ProsCons";
import { SpecsTable } from "@/components/blocks/SpecsTable";

/**
 * Server component that turns a Payload Lexical state into React. Walks
 * `root.children` and renders only the node types we use in content
 * (Reviews, Articles, Pages, ComparisonPairs). Unknown nodes render nothing
 * so a future block type added in the admin doesn't crash the public site;
 * dev console gets a warning so we notice and add a renderer.
 *
 * Lexical text formatting is a bitmask:
 *   bold=1  italic=2  strikethrough=4  underline=8  code=16
 * We honour the five common flags. Subscript/superscript are ignored — no
 * content surface needs them yet.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LexNode = { type: string; version?: number; [k: string]: any };

type LexState = { root: { children: LexNode[] } } | null | undefined;

const FORMAT_BOLD = 1;
const FORMAT_ITALIC = 2;
const FORMAT_STRIKETHROUGH = 4;
const FORMAT_UNDERLINE = 8;
const FORMAT_CODE = 16;

function renderText(node: LexNode, key: number): React.ReactNode {
  const text = String(node.text ?? "");
  if (text === "") return null;
  const format = Number(node.format ?? 0);
  let el: React.ReactNode = text;
  if (format & FORMAT_CODE) {
    el = (
      <code key={key} className="bg-surface-muted rounded px-1 py-0.5 text-[0.9em]">
        {el}
      </code>
    );
  }
  if (format & FORMAT_BOLD) el = <strong key={key}>{el}</strong>;
  if (format & FORMAT_ITALIC) el = <em key={key}>{el}</em>;
  if (format & FORMAT_UNDERLINE) el = <u key={key}>{el}</u>;
  if (format & FORMAT_STRIKETHROUGH) el = <s key={key}>{el}</s>;
  return <span key={key}>{el}</span>;
}

function renderInline(children: LexNode[] | undefined): React.ReactNode {
  if (!children || children.length === 0) return null;
  return children.map((child, i) => {
    switch (child.type) {
      case "text":
        return renderText(child, i);
      case "linebreak":
        return <br key={i} />;
      case "link":
      case "autolink": {
        const url = String(child.fields?.url ?? child.url ?? "#");
        const newTab = Boolean(child.fields?.newTab ?? child.target === "_blank");
        const inner = renderInline(child.children as LexNode[] | undefined);
        // Internal links use next/link; external/`mailto:` use a plain <a>.
        const isInternal = url.startsWith("/");
        if (isInternal) {
          return (
            <Link key={i} href={url} className="text-brand-accent underline">
              {inner}
            </Link>
          );
        }
        return (
          <a
            key={i}
            href={url}
            className="text-brand-accent underline"
            {...(newTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          >
            {inner}
          </a>
        );
      }
      default:
        // Inline-context fallback: render whatever text children exist.
        if (Array.isArray(child.children)) {
          return <span key={i}>{renderInline(child.children as LexNode[])}</span>;
        }
        return null;
    }
  });
}

function renderBlock(node: LexNode, key: number): React.ReactNode {
  // Payload's BlocksFeature wraps block instances in a node of type 'block'
  // with fields under `fields` and a `blockType` discriminator.
  const fields = node.fields ?? {};
  const blockType = String(fields.blockType ?? "");
  switch (blockType) {
    case "heroImage":
      return (
        <HeroImage
          key={key}
          image_path={String(fields.image_path ?? "")}
          alt={String(fields.alt ?? "")}
          caption={fields.caption ? String(fields.caption) : undefined}
          credit={fields.credit ? String(fields.credit) : undefined}
        />
      );
    case "specsTable":
      return (
        <SpecsTable
          key={key}
          model_version={fields.model_version ?? null}
          manual_rows={Array.isArray(fields.manual_rows) ? fields.manual_rows : undefined}
        />
      );
    case "prosCons":
      return (
        <ProsCons
          key={key}
          pros={Array.isArray(fields.pros) ? fields.pros : undefined}
          cons={Array.isArray(fields.cons) ? fields.cons : undefined}
        />
      );
    case "ctaButton":
      return (
        <CtaButton
          key={key}
          label={String(fields.label ?? "")}
          href={String(fields.href ?? "#")}
          variant={fields.variant ?? undefined}
          open_in_new_tab={Boolean(fields.open_in_new_tab)}
        />
      );
    case "disclaimerBox":
      return (
        <DisclaimerBox
          key={key}
          text={String(fields.text ?? "")}
          variant={fields.variant ?? undefined}
        />
      );
    default:
      if (process.env.NODE_ENV !== "production") {
        console.warn(`[lexical/render] Unknown block type: ${blockType}`);
      }
      return null;
  }
}

function renderListItem(node: LexNode, key: number): React.ReactNode {
  return <li key={key}>{renderInline(node.children as LexNode[] | undefined)}</li>;
}

function renderHeading(node: LexNode, key: number): React.ReactNode {
  const tag = String(node.tag ?? "h2");
  const inner = renderInline(node.children as LexNode[] | undefined);
  // Tailwind utility classes keep visual rhythm consistent across content
  // surfaces (reviews, articles, leasing guide). h1 is left to the page
  // shell; content should start at h2.
  switch (tag) {
    case "h1":
      return (
        <h1 key={key} className="mb-4 mt-12 text-3xl font-bold">
          {inner}
        </h1>
      );
    case "h2":
      return (
        <h2 key={key} className="mb-4 mt-10 text-2xl font-semibold">
          {inner}
        </h2>
      );
    case "h3":
      return (
        <h3 key={key} className="mb-3 mt-8 text-xl font-semibold">
          {inner}
        </h3>
      );
    case "h4":
      return (
        <h4 key={key} className="mb-2 mt-6 text-lg font-semibold">
          {inner}
        </h4>
      );
    default:
      return (
        <h5 key={key} className="mb-2 mt-4 text-base font-semibold">
          {inner}
        </h5>
      );
  }
}

function renderNode(node: LexNode, key: number): React.ReactNode {
  switch (node.type) {
    case "paragraph": {
      const inner = renderInline(node.children as LexNode[] | undefined);
      if (!inner) return null;
      return (
        <p key={key} className="my-4 leading-relaxed">
          {inner}
        </p>
      );
    }
    case "heading":
      return renderHeading(node, key);
    case "list": {
      const tag = node.tag === "ol" || node.listType === "number" ? "ol" : "ul";
      const items = (node.children as LexNode[] | undefined) ?? [];
      const className = tag === "ol" ? "my-4 list-decimal pl-6" : "my-4 list-disc pl-6";
      const inner = items.map((item, i) => renderListItem(item, i));
      return tag === "ol" ? (
        <ol key={key} className={className}>
          {inner}
        </ol>
      ) : (
        <ul key={key} className={className}>
          {inner}
        </ul>
      );
    }
    case "quote":
      return (
        <blockquote
          key={key}
          className="border-brand-accent text-text-muted my-6 border-l-4 pl-4 italic"
        >
          {renderInline(node.children as LexNode[] | undefined)}
        </blockquote>
      );
    case "horizontalrule":
      return <hr key={key} className="border-surface-border my-8" />;
    case "block":
      return renderBlock(node, key);
    default:
      if (process.env.NODE_ENV !== "production") {
        console.warn(`[lexical/render] Unknown node type: ${node.type}`);
      }
      return null;
  }
}

export function LexicalRenderer({ content }: { content: LexState }) {
  if (!content?.root?.children?.length) return null;
  return (
    <div className="text-text">{content.root.children.map((node, i) => renderNode(node, i))}</div>
  );
}
