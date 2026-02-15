import {
  createJSONEditor,
  JSONEditorPropsOptional,
  JsonEditor,
} from "vanilla-jsoneditor";
import { useEffect, useRef } from "react";
import "./VanillaJSONEditor.css";
import "vanilla-jsoneditor/themes/jse-theme-dark.css"; // Import dark theme CSS

interface VanillaJSONEditorProps extends JSONEditorPropsOptional {
  style?: React.CSSProperties;
  className?: string;
}

export default function VanillaJSONEditor({
  style,
  className,
  ...props
}: VanillaJSONEditorProps) {
  const refContainer = useRef<HTMLDivElement | null>(null);
  const refEditor = useRef<JsonEditor | null>(null);
  const refPrevProps = useRef<JSONEditorPropsOptional>(props);

  // Listen for theme changes and update the editor container class accordingly
  useEffect(() => {
    const root = document.documentElement;
    const updateTheme = () => {
      if (!refContainer.current) return;
      // Detect dark mode from root or class
      const isDark = root.classList.contains("dark");
      if (isDark) {
        refContainer.current.classList.add("jse-theme-dark");
      } else {
        refContainer.current.classList.remove("jse-theme-dark");
      }
      // Refresh editor to apply new styles
      if (refEditor.current) {
        refEditor.current.refresh();
      }
    };

    updateTheme();
    // Listen for class changes on <html> (theme-toggle updates root class)
    const observer = new MutationObserver(updateTheme);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });

    // Listen for prefers-color-scheme changes
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    media.addEventListener("change", updateTheme);

    return () => {
      observer.disconnect();
      media.removeEventListener("change", updateTheme);
    };
  }, []);

  useEffect(() => {
    // create editor
    refEditor.current = createJSONEditor({
      target: refContainer.current as HTMLDivElement,
      props,
    });

    return () => {
      // destroy editor
      if (refEditor.current) {
        refEditor.current.destroy();
        refEditor.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // update props
  useEffect(() => {
    if (refEditor.current) {
      const changedProps = filterUnchangedProps(props, refPrevProps.current);
      refEditor.current.updateProps(changedProps);
      refPrevProps.current = props;
    }
  }, [props]);

  return (
    <div
      className={`vanilla-jsoneditor-react ${className ?? ""}`}
      ref={refContainer}
      style={style}
    />
  );
}

function filterUnchangedProps(
  props: JSONEditorPropsOptional,
  prevProps: JSONEditorPropsOptional
): JSONEditorPropsOptional {
  return Object.fromEntries(
    Object.entries(props).filter(
      ([key, value]) =>
        value !== prevProps[key as keyof JSONEditorPropsOptional]
    )
  );
}
