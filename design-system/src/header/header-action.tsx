import "./common.css";
import { getIconSvg } from "../icons/icons";
import { Button } from "../buttons";
import { ComponentProps, FC, ReactElement } from "react";

export interface HeaderActionProps {
  title: String,
  icon1: FC<ComponentProps<"svg">>
  icon2: FC<ComponentProps<"svg">>
  handlePrimaryAction: Function,
  handleSecondaryAction: Function,
}

const HeaderAction: React.FC<HeaderActionProps> = ({
  title,
  icon1,
  icon2,
  handlePrimaryAction,
  handleSecondaryAction
}: HeaderActionProps) => {
  return (
    <div className={`header-action-container`}>
        <Button onClick={handlePrimaryAction} type="icon" icon={icon1({}) as ReactElement<any>}></Button>
        <h1>{title}</h1>
        <Button onClick={handleSecondaryAction} type="icon" icon={icon2({}) as ReactElement<any>}></Button>
    </div>
  );
};

export default HeaderAction;