import { Textarea } from "flowbite-react";
import { TextAreaProps } from "./textarea.stories";
import WithLabel from "./label";
import './common.css';

const TextArea: React.FC<TextAreaProps> = ({ placeholder, labelValue, id, errored, required, withInfo, disabled, rows } : TextAreaProps) => {

  return (
    <WithLabel id={id} labelValue={labelValue} withInfo={withInfo}>
      <Textarea id={id} className="textarea" placeholder={placeholder} required={required} disabled={disabled} rows={rows} />
    </WithLabel>
  )
}

export default TextArea