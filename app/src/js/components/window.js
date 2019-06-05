import React from 'react';
import LabelLayout from './label_layout';
import TitleBar from './title_bar';
import Session from '../common/session';
import Path from '../common/path';
// $FlowFixMe
import {ToolBar} from '../components/toolbar';
import ImageView from '../components/image_view';

type Props = {

}

/**
 * Manage the whole window
 */
export class Window extends React.Component<Props> {
  /**
   * Window constructor
   * @param {Object} props: name of the container in HTML to
   * place this window
   */
  constructor(props: Object) {
    super(props);
  }

  /**
   * Function to render the interface
   * @return {React.Fragment}
   */
  render() {
    /* LabelLayout props:
         * titleBar: required
         * main: required
         * leftSidebar1: required
         * leftSidebar2: optional
         * bottomBar: optional
         * rightSidebar1: optional
         * rightSidebar2: optional
         */
    let state = Session.getState();

    // get all the components
    let titleBar = (
        <TitleBar
            title={state.config.pageTitle}
            instructionLink={state.config.instructionPage}
            dashboardLink={Path.vendorDashboard()}
        />
    );
    let leftSidebar1 = (
        <ToolBar
            categories={state.config.categories}
            attributes={state.config.attributes}
            itemType={state.config.itemType}
            labelType={state.config.labelType}
        />
    );
    /* const leftSidebar1 = (<ToolBar/>); // just replace this*/
    let imageView = (<ImageView key={'imageView'}/>);
    let bottomBar = null;
    let rightSidebar1 = null;
    let rightSidebar2 = null;
    // render the interface
    return (
        <LabelLayout
            titleBar={titleBar}
            leftSidebar1={leftSidebar1}
            bottomBar={bottomBar}
            main={imageView}
            rightSidebar1={rightSidebar1}
            rightSidebar2={rightSidebar2}
        />
    );
  }
}

export default Window;
