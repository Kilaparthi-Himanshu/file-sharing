import type { ExoticComponent, ReactNode } from "react";

declare module "react" {
    interface ViewTransitionInstance {
        old: Element;
        new: Element;
    }

    interface ViewTransitionProps {
        children?: ReactNode;
        onUpdate?: (instance: ViewTransitionInstance) => void;
        onEnter?: (instance: ViewTransitionInstance) => void;
        onExit?: (instance: ViewTransitionInstance) => void;
    }

    export const ViewTransition: ExoticComponent<ViewTransitionProps>;
}
